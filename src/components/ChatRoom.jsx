import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import socket from '../services/socket';
import { chatService } from '../services/api';
import '../styles/ChatRoom.css';
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ChatRoom({ room }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [showMembersList, setShowMembersList] = useState(false);
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [reactionMenuFor, setReactionMenuFor] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!room || !user) return;

    const fetchHistory = async () => {
      try {
        const response = await chatService.getMessages(room.id);
        const normalizedMessages = (response.data.messages || []).map((message) => ({
          ...message,
          reactions: message.reactions || {},
          reactedUsers: message.reactedUsers || {}
        }));
        setMessages(normalizedMessages);
      } catch {
        setMessages([]);
      }
    };

    fetchHistory();

    // Join room
    socket.emit('join-room', {
      roomId: room.id,
      userId: user.id,
      username: user.username
    });

    setLoading(false);
    return () => {
      socket.emit('leave-room', {
        roomId: room.id,
        userId: user.id,
        username: user.username
      });
    };
  }, [room, user]);

  useEffect(() => {
    setMemberCount(Number(room?.memberCount) || 0);
  }, [room?.id, room?.memberCount]);

  const fetchJoinedUsers = async () => {
    if (!room?.id) {
      return;
    }

    try {
      setMembersLoading(true);
      setMembersError('');
      const response = await chatService.getRoomMembers(room.id);
      setJoinedUsers(response.data?.members || []);
      setMemberCount(Number(response.data?.memberCount) || 0);
    } catch {
      setMembersError('Unable to load joined users right now.');
      setJoinedUsers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // Listen for messages and events
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, {
        ...message,
        reactions: message.reactions || {},
        reactedUsers: message.reactedUsers || {}
      }]);
    };

    const handleUserJoined = ({ username, membersCount }) => {
      setMemberCount(membersCount);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        message: `${username} joined the room`
      }]);

      if (showMembersList) {
        fetchJoinedUsers();
      }
    };

    const handleUserLeft = ({ username, membersCount }) => {
      setMemberCount(membersCount);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        message: `${username} left the room`
      }]);

      if (showMembersList) {
        fetchJoinedUsers();
      }
    };

    const handleUserTyping = ({ username }) => {
      setTyping(prev => [...new Set([...prev, username])]);
    };

    const handleUserStopTyping = () => {
      setTyping([]);
    };

    const handleMessageReacted = ({ roomId, messageId, reactions, reactedUsers }) => {
      if (roomId !== room?.id) {
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

    socket.on('new-message', handleNewMessage);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);
    socket.on('message-reacted', handleMessageReacted);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      socket.off('message-reacted', handleMessageReacted);
    };
  }, [room?.id, showMembersList]);

  useEffect(() => {
    setReactionMenuFor('');
    setShowMembersList(false);
    setJoinedUsers([]);
    setMembersError('');
  }, [room?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!typingTimeoutRef.current) {
      socket.emit('typing', { roomId: room.id, username: user.username });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { roomId: room.id });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const roomInterest = room.interest || room.sport || 'General';

    socket.emit('send-message', {
      roomId: room.id,
      userId: user.id,
      username: user.username,
      message: newMessage,
      interest: roomInterest,
      sport: roomInterest
    });

    setNewMessage('');
    socket.emit('stop-typing', { roomId: room.id });
  };

  const reactToMessage = (messageId, emoji) => {
    socket.emit('react-message', {
      roomId: room.id,
      messageId,
      userId: user.id,
      emoji
    });
    setReactionMenuFor('');
  };

  const isOwnMessage = (msg) => {
    if (msg.senderSocketId) {
      return msg.senderSocketId === socket.id;
    }
    return msg.userId === user?.id;
  };

  const getReactionEntries = (msg) => (
    Object.entries(msg.reactions || {}).filter(([, count]) => Number(count) > 0)
  );

  const handleToggleMembersList = () => {
    setShowMembersList((prev) => {
      const next = !prev;
      if (next) {
        fetchJoinedUsers();
      }
      return next;
    });
  };

  if (loading) {
    return <div className="chat-room loading">Loading chat...</div>;
  }

  const roomInterestLabel = String(room.interest || room.sport || '').trim();
  const displayRoomTopic = !roomInterestLabel || roomInterestLabel.toLowerCase() === 'general'
    ? room.name
    : roomInterestLabel;

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>{room.name}</h2>
        <div className="room-meta">
          <span className="sport-badge">{displayRoomTopic}</span>
          <button
            type="button"
            className="member-count"
            onClick={handleToggleMembersList}
            aria-expanded={showMembersList}
            aria-label="Show joined users"
          >
            👥 {memberCount}
          </button>
        </div>
      </div>

      {showMembersList && (
        <div className="members-popout" role="dialog" aria-label="Joined users list">
          <div className="members-popout-header">
            <h3>Joined users</h3>
            <button
              type="button"
              className="members-close-btn"
              onClick={() => setShowMembersList(false)}
              aria-label="Close joined users"
            >
              x
            </button>
          </div>

          {membersLoading ? (
            <p className="members-popout-state">Loading users...</p>
          ) : membersError ? (
            <p className="members-popout-state">{membersError}</p>
          ) : joinedUsers.length === 0 ? (
            <p className="members-popout-state">No users joined yet.</p>
          ) : (
            <ul className="members-list">
              {joinedUsers.map((member) => (
                <li key={member.id} className="member-item">
                  <span>{member.username}</span>
                  <span className="member-dot online" title="Online" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`message ${msg.type === 'system' ? 'system' : ''} ${
                isOwnMessage(msg) ? 'own' : ''
              }`}
            >
              {msg.type !== 'system' && (
                <>
                  <span className="username">{msg.username}</span>
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </>
              )}
              <p className="message-text">{msg.message}</p>
              {msg.type !== 'system' && (
                <div className="message-reactions">
                  <button
                    className="react-btn"
                    onClick={() => setReactionMenuFor((prev) => (prev === msg.id ? '' : msg.id))}
                    type="button"
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
        {typing.length > 0 && (
          <div className="typing-indicator">
            {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button type="submit" disabled={!newMessage.trim() || loading}>
          Send
        </button>
      </form>
    </div>
  );
}
