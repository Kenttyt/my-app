import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import socket, { ensureSocketConnected } from '../services/socket';
import '../styles/RandomChat.css';
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function RandomChat({ selectedInterests = [] }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [roomId, setRoomId] = useState('');
  const [peer, setPeer] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [showPeerProfile, setShowPeerProfile] = useState(false);
  const [reactionMenuFor, setReactionMenuFor] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const listenersReadyRef = useRef(false);
  const pendingActionRef = useRef('');

  const canType = useMemo(() => status === 'connected' && roomId, [status, roomId]);
  const selectedInterestsLabel = useMemo(() => {
    if (selectedInterests.length === 0) {
      return 'General';
    }

    const specificInterests = selectedInterests.filter(
      (interest) => interest.trim().toLowerCase() !== 'general'
    );

    const visibleInterests = specificInterests.length > 0 ? specificInterests : selectedInterests;
    return visibleInterests.join(', ');
  }, [selectedInterests]);

  useEffect(() => {
    const onMatchmaking = ({ interest, sport }) => {
      const activeInterest = interest || sport || 'General';
      setStatus('searching');
      setMessages([{ id: `${Date.now()}-search`, type: 'system', message: `Searching for someone into ${activeInterest}...` }]);
      setPeer(null);
      setRoomId('');
    };

    const onStrangerFound = ({ roomId: nextRoomId, peer, interest, sport }) => {
      const sharedInterest = String(interest || sport || '').trim();
      setStatus('connected');
      setRoomId(nextRoomId);
      setPeer(peer);
      setShowPeerProfile(false);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-found`, type: 'system', message: `Connected with ${peer?.username || 'New Friend'}` },
        ...(sharedInterest
          ? [{ id: `${Date.now()}-common`, type: 'system', message: `You both like ${sharedInterest}` }]
          : [])
      ]);
    };

    const onNewMessage = (msg) => {
      if (msg.roomId && roomId && msg.roomId !== roomId) {
        return;
      }
      setMessages((prev) => [...prev, {
        ...msg,
        reactions: msg.reactions || {},
        reactedUsers: msg.reactedUsers || {}
      }]);
    };

    const onMessageReacted = ({ roomId: eventRoomId, messageId, reactions, reactedUsers }) => {
      if (eventRoomId && roomId && eventRoomId !== roomId) {
        return;
      }

      setMessages((prev) => prev.map((message) => (
        message.id === messageId
          ? {
            ...message,
            reactions: reactions || {},
            reactedUsers: reactedUsers || {}
          }
          : message
      )));
    };

    const onDisconnected = () => {
      setStatus('idle');
      setPeer(null);
      setRoomId('');
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-left`, type: 'system', message: 'Stranger disconnected.' }
      ]);
    };

    const onTyping = () => setTyping(true);
    const onStopTyping = () => setTyping(false);
    const onOnlineCount = ({ count }) => setOnlineCount(Number(count) || 0);

    socket.on('matchmaking', onMatchmaking);
    socket.on('stranger-found', onStrangerFound);
    socket.on('new-message', onNewMessage);
    socket.on('message-reacted', onMessageReacted);
    socket.on('stranger-disconnected', onDisconnected);
    socket.on('user-typing', onTyping);
    socket.on('user-stop-typing', onStopTyping);
    socket.on('online-count', onOnlineCount);
    socket.emit('get-online-count');
    listenersReadyRef.current = true;

    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = '';
      startMatchmaking(action, true);
    }

    return () => {
      socket.off('matchmaking', onMatchmaking);
      socket.off('stranger-found', onStrangerFound);
      socket.off('new-message', onNewMessage);
      socket.off('message-reacted', onMessageReacted);
      socket.off('stranger-disconnected', onDisconnected);
      socket.off('user-typing', onTyping);
      socket.off('user-stop-typing', onStopTyping);
      socket.off('online-count', onOnlineCount);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typing]);

  useEffect(() => {
    return () => {
      socket.emit('cancel-matchmaking');
      socket.emit('leave-random-chat');
    };
  }, []);

  const startMatchmaking = (eventName, force = false) => {
    if (!user) {
      return;
    }

    if (!listenersReadyRef.current && !force) {
      pendingActionRef.current = eventName;
      return;
    }

    setDraft('');
    setTyping(false);

    const payload = {
      userId: user.id,
      username: user.username,
      interests: selectedInterests,
      interest: selectedInterests[0] || 'General',
      sports: selectedInterests,
      sport: selectedInterests[0] || 'General',
      bio: user.bio || '',
      profileInterests: user.interests || user.sports || [],
      profileSports: user.interests || user.sports || []
    };

    ensureSocketConnected().then(() => {
      socket.emit(eventName, payload);
    });
  };

  const startSearch = () => {
    startMatchmaking('find-stranger');
  };

  const nextStranger = () => {
    startMatchmaking('next-stranger');
  };

  const stopSearch = () => {
    socket.emit('cancel-matchmaking');
    socket.emit('leave-random-chat');
    setStatus('idle');
    setRoomId('');
    setPeer(null);
    setTyping(false);
    setReactionMenuFor('');
  };

  const handleTyping = (value) => {
    setDraft(value);
    if (!canType) {
      return;
    }

    socket.emit('typing', { roomId, username: user.username });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stop-typing', { roomId });
    }, 900);
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (!draft.trim() || !roomId) {
      return;
    }

    socket.emit('send-message', {
      roomId,
      userId: user.id,
      username: user.username,
      message: draft.trim(),
      interest: selectedInterests[0] || 'General',
      sport: selectedInterests[0] || 'General'
    });

    setDraft('');
    socket.emit('stop-typing', { roomId });
  };

  const isOwnMessage = (msg) => {
    if (msg.senderSocketId) {
      return msg.senderSocketId === socket.id;
    }
    return msg.userId === user?.id;
  };

  const reactToMessage = (messageId, emoji) => {
    if (!roomId) {
      return;
    }

    const reactionKey = socket.id ? `${user?.id || 'guest'}:${socket.id}` : user?.id;
    socket.emit('react-message', {
      roomId,
      messageId,
      userId: user.id,
      reactionKey,
      emoji
    });
    setReactionMenuFor('');
  };

  const getReactionEntries = (msg) => (
    Object.entries(msg.reactions || {}).filter(([, count]) => Number(count) > 0)
  );

  return (
    <section className="random-chat-wrap">
      <header className="random-head">
        <div>
          <h2>Random Interest Match</h2>
          <p>
            Interests: <strong>{selectedInterestsLabel}</strong>
          </p>
        </div>
        <div className="status-stack">
          <div className="status-pill">
            <span className={`dot ${status}`} />
            {status === 'connected' ? 'Online' : status === 'searching' ? 'Searching' : 'Offline'}
          </div>
          <div className="online-pill">
            {onlineCount} online
          </div>
        </div>
      </header>

      <div className="random-actions">
        <button onClick={startSearch} disabled={status === 'searching'}>
          {status === 'searching' ? 'Matching...' : 'Find Stranger'}
        </button>
        <button onClick={nextStranger} disabled={!roomId} className="alt">
          Next
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => setShowPeerProfile(true)}
          disabled={!peer}
        >
          View Stranger Profile
        </button>
        <button onClick={stopSearch} className="ghost">
          Stop
        </button>
      </div>

      <div className="random-chat-box">
        {messages.length === 0 ? (
          <div className="empty-random">
            <p>Press "Find Stranger" to start a one-on-one interest chat.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`bubble ${msg.type === 'system' ? 'system' : ''} ${isOwnMessage(msg) ? 'own' : ''}`}
            >
              {msg.type !== 'system' && (
                <>
                  <span className="meta">
                    {isOwnMessage(msg) ? 'You' : peer?.username || msg.username}
                  </span>
                </>
              )}
              <p className="message-text">{msg.message}</p>
              {msg.type !== 'system' && (
                <div className="message-reactions">
                  <button
                    className="react-btn"
                    type="button"
                    onClick={() => setReactionMenuFor((prev) => (prev === msg.id ? '' : msg.id))}
                  >
                    React
                  </button>

                  {reactionMenuFor === msg.id && (
                    <div className="reaction-picker">
                      {REACTIONS.map((emoji) => (
                        <button
                          key={`${msg.id}-${emoji}`}
                          type="button"
                          onClick={() => reactToMessage(msg.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {getReactionEntries(msg).length > 0 && (
                    <div className="reaction-summary">
                      {getReactionEntries(msg).map(([emoji, count]) => (
                        <span key={`${msg.id}-${emoji}`} className="reaction-pill">
                          {emoji} {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {typing && roomId && <p className="typing-row">Stranger is typing...</p>}
        <div ref={messagesEndRef} />
      </div>

      <form className="random-input-row" onSubmit={sendMessage}>
        <input
          type="text"
          value={draft}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder={canType ? 'Type your message...' : 'Connect to start chatting'}
          disabled={!canType}
        />
        <button type="submit" disabled={!canType || !draft.trim()}>
          Send
        </button>
      </form>

      {showPeerProfile && peer && (
        <div className="peer-profile-overlay" onClick={() => setShowPeerProfile(false)}>
          <div className="peer-profile-modal" onClick={(event) => event.stopPropagation()}>
            <div className="peer-profile-head">
              <h3>{peer.username || 'New Friend'}</h3>
              <button type="button" onClick={() => setShowPeerProfile(false)}>
                Close
              </button>
            </div>

            <p className="peer-profile-bio">
              {peer.bio || 'No bio added yet.'}
            </p>

            <div className="peer-sports-wrap">
              <h4>Interests</h4>
              <div className="peer-sports-list">
                {(peer.interests || peer.sports || []).length === 0 ? (
                  <span className="peer-empty">No interests listed.</span>
                ) : (
                  (peer.interests || peer.sports || []).map((interest) => (
                    <span key={interest} className="peer-sport-chip">{interest}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
