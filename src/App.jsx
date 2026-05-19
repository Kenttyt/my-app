import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import RandomChat from './components/RandomChat';
import LandingPage from './components/LandingPage';
import UserProfile from './components/UserProfile';
import SportSelector from './components/SportSelector';
import './App.css';
import './styles/LandingPage.css';
import './styles/RandomChat.css';

export default function App() {
  const { user } = useAuth();
  const getValidInterest = (interests = []) => (
    interests.find((interest) => interest?.trim?.().toLowerCase() !== 'all interests') || 'General'
  );

  const defaultInterest = useMemo(
    () => getValidInterest(user?.interests || user?.sports || []),
    [user]
  );

  const [view, setView] = useState('landing');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomInterestQuery, setRoomInterestQuery] = useState('');
  const [selectedRandomInterests, setSelectedRandomInterests] = useState([defaultInterest]);
  const [interestOptions, setInterestOptions] = useState(() => (user?.interests || user?.sports || []).filter(Boolean));
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    return 'dark';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const seededInterests = (user?.interests || user?.sports || []).filter(Boolean);
    if (seededInterests.length === 0) {
      return;
    }

    setInterestOptions((prev) => {
      const next = [...prev];
      seededInterests.forEach((item) => {
        if (!next.some((current) => current.toLowerCase() === item.toLowerCase())) {
          next.push(item);
        }
      });
      return next;
    });
  }, [user]);

  useEffect(() => {
    setSelectedRandomInterests((prev) => {
      const filtered = prev.filter((interest) => interest?.trim?.().toLowerCase() !== 'all interests');
      return filtered.length > 0 ? filtered : [defaultInterest];
    });
  }, [defaultInterest]);

  if (!user) {
    return (
      <div className="boot-screen">
        <p>Connecting you as a guest...</p>
      </div>
    );
  }

  const handleOpenRandom = () => {
    if (selectedRandomInterests.length === 0) {
      setSelectedRandomInterests([defaultInterest]);
    }
    setView('random');
    setSelectedRoom(null);
  };

  const toggleRandomInterest = (interest) => {
    setSelectedRandomInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const addInterestOption = (rawInterest) => {
    const interest = String(rawInterest || '').trim();
    if (!interest) {
      return;
    }

    setInterestOptions((prev) => {
      if (prev.some((item) => item.toLowerCase() === interest.toLowerCase())) {
        return prev;
      }
      return [...prev, interest];
    });

    setSelectedRandomInterests((prev) => {
      if (prev.some((item) => item.toLowerCase() === interest.toLowerCase())) {
        return prev;
      }

      const withoutGeneral = prev.filter((item) => item.trim().toLowerCase() !== 'general');
      return [...withoutGeneral, interest];
    });
  };

  const removeInterestOption = (rawInterest) => {
    const interest = String(rawInterest || '').trim();
    if (!interest) {
      return;
    }

    setSelectedRandomInterests((prev) => prev.filter((item) => item !== interest));
    setInterestOptions((prev) => prev.filter((item) => item !== interest));
  };

  const handleOpenRooms = () => {
    setView('rooms');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="brand-block">
          <h1>ChatHive</h1>
          <p>Where real-time conversations happen</p>
        </div>

        <div className="global-actions">
          <button
            className="theme-toggle"
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Toggle light and dark mode"
            onClick={toggleTheme}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-thumb">
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </span>
          </button>

          <div className="mode-pills" role="tablist" aria-label="Chat mode selector">
            <button
              className={`mode-pill ${view === 'landing' ? 'active' : ''}`}
              onClick={() => setView('landing')}
            >
              Home
            </button>
            <button
              className={`mode-pill ${view === 'random' ? 'active' : ''}`}
              onClick={handleOpenRandom}
            >
              Find a Stranger
            </button>
            <button
              className={`mode-pill ${view === 'rooms' ? 'active' : ''}`}
              onClick={handleOpenRooms}
            >
              Rooms
            </button>
          </div>

          <button
            className="profile-chip"
            aria-label="View profile"
            onClick={() => setShowProfile(true)}
          >
            {user.username}
          </button>
        </div>
      </div>

      {view === 'landing' && (
        <LandingPage
          onStartChatting={handleOpenRooms}
          onFindStranger={handleOpenRandom}
        />
      )}

      {view === 'random' && (
        <div className="random-shell">
          <SportSelector
            sports={interestOptions}
            selectedSports={selectedRandomInterests}
            onToggleSport={toggleRandomInterest}
            onRemoveSport={removeInterestOption}
            onCreateSport={addInterestOption}
            placeholder="Search and pick interests for random chat"
            buttonClassName="sport-chip"
            layout="wrap"
            containerClassName="floating-sports"
            collapsible={true}
            openLabel={`Select Interests (${selectedRandomInterests.length})`}
            closeLabel="Close Interests"
            multiSelect={true}
            allowCreate={true}
          />

          <RandomChat selectedInterests={selectedRandomInterests} />
        </div>
      )}

      {view === 'rooms' && (
        <div className="app-main">
          <div className="sidebar">
            <div className="sports-filter">
              <h3>Interest Rooms</h3>
              <SportSelector
                sports={interestOptions}
                selectedSport=""
                onSelectSport={() => {}}
                placeholder="Search interest rooms"
                buttonClassName="sport-btn"
                layout="grid"
                containerClassName="room-sport-selector"
                collapsible={true}
                openLabel="Search Room Interests"
                closeLabel="Close Interests"
                allowCreate={false}
                searchOnly={true}
                onSearchQueryChange={setRoomInterestQuery}
              />
            </div>

            <RoomList
              onRoomSelect={setSelectedRoom}
              selectedRoom={selectedRoom}
              currentInterestQuery={roomInterestQuery}
            />
          </div>

          <div className="chat-area">
            {selectedRoom ? (
              <ChatRoom room={selectedRoom} />
            ) : (
              <div className="no-room-selected">
                <h3>Join an Interest Room</h3>
                <p>Pick a room to start the conversation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
