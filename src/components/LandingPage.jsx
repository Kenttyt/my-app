import { useEffect, useState } from 'react';
import socket from '../services/socket';
import '../styles/LandingPage.css';

export default function LandingPage({
  onStartChatting,
  onFindStranger
}) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const onOnlineCount = ({ count }) => setOnlineCount(Number(count) || 0);
    socket.on('online-count', onOnlineCount);
    socket.emit('get-online-count');
    return () => socket.off('online-count', onOnlineCount);
  }, []);

  return (
    <section className="landing-wrap">
      <div className="landing-glow landing-glow-red" />
      <div className="landing-glow landing-glow-blue" />

      <div className="landing-content">
        <p className="eyebrow">REAL-TIME INTEREST COMMUNITY</p>
        <h2>Talk. Match. Hype.</h2>
        <p className="hero-copy">
          Jump into live conversations with people who share your interests. Enter themed rooms
          or get instantly matched with a random stranger for real, unfiltered chats.
        </p>

        <div className="cta-row">
          <button className="cta cta-primary" onClick={onStartChatting}>
            Start Chatting
          </button>
          <button className="cta cta-secondary" onClick={onFindStranger}>
            Find a Stranger
          </button>
        </div>
      </div>

      <div className="community-cards">
        <article>
          <span className="stat">{onlineCount}</span>
          <p>People online right now</p>
        </article>
        <article>
          <span className="stat">Random</span>
          <p>Interest-based random matchmaking</p>
        </article>
        <article>
          <span className="stat">Rooms</span>
          <p>Live rooms by topic and vibe</p>
        </article>
      </div>
    </section>
  );
}
