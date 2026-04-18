import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';
import '../styles/UserProfile.css';

export default function UserProfile({ onClose }) {
  const { user, logout, updateProfile, startNewGuestSession } = useAuth();
  const isGuestUser = String(user?.id || '').startsWith('guest-');
  const [interests, setInterests] = useState(user?.interests || user?.sports || []);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [sportQuery, setSportQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredInterests = useMemo(() => {
    const query = sportQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return interests
      .filter((interest) => interest.toLowerCase().includes(query))
      .slice(0, 8);
  }, [sportQuery, interests]);

  const addInterest = (interest) => {
    const normalized = String(interest || '').trim();
    if (!normalized) {
      return;
    }

    if (interests.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return;
    }

    setInterests((prev) => [...prev, normalized]);
    setSportQuery('');
    setShowSportPicker(false);
  };

  const removeInterest = (interest) => {
    setInterests((prev) => prev.filter((item) => item !== interest));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (isGuestUser) {
        const nextUsername = username.trim();
        if (!nextUsername) {
          setError('Name is required');
          return;
        }

        updateProfile({
          username: nextUsername,
          bio: bio.trim(),
          interests,
          sports: interests
        });
      } else {
        await userService.updateInterests(interests);
      }

      setSuccess('Preferences saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleNewStranger = () => {
    if (isGuestUser) {
      startNewGuestSession();
    } else {
      logout();
    }
    onClose();
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <h2>Profile</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="profile-content">
          <div className="user-info">
            <h3>{user?.username}</h3>
            {!isGuestUser && <p>{user?.email}</p>}
            {isGuestUser && <p>Guest account</p>}
          </div>

          {isGuestUser && (
            <div className="guest-profile-editor">
              <h4>Guest Profile</h4>
              <label>
                Name
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter display name"
                  maxLength={30}
                />
              </label>
              <label>
                Bio
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Tell people about your vibe"
                  maxLength={140}
                  rows={3}
                />
              </label>
            </div>
          )}

          <div className="sports-section">
            <h4>Interests</h4>
            <div className="selected-sports-list">
              {interests.length === 0 ? (
                <p className="sports-placeholder">No interests added yet.</p>
              ) : (
                interests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    className="selected-sport-btn"
                    onClick={() => removeInterest(interest)}
                    title="Remove interest"
                  >
                    {interest}
                    <span>×</span>
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              className="add-sport-toggle"
              onClick={() => {
                setShowSportPicker((prev) => !prev);
                setSportQuery('');
              }}
            >
              {showSportPicker ? 'Cancel' : 'Add Interest'}
            </button>

            {showSportPicker && (
              <div className="sport-search-box">
                <input
                  type="text"
                  value={sportQuery}
                  onChange={(event) => setSportQuery(event.target.value)}
                  placeholder="Type an interest to add"
                />

                <button
                  type="button"
                  className="sport-result-btn"
                  onClick={() => addInterest(sportQuery)}
                  disabled={!sportQuery.trim()}
                >
                  Add "{sportQuery.trim() || 'interest'}"
                </button>

                {filteredInterests.length === 0 ? (
                  <p className="sports-helper">Your interests will appear here when they match search text.</p>
                ) : (
                  <>
                    <p className="sports-helper">Already added interests:</p>
                  <div className="sports-search-results">
                    {filteredInterests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        className="sport-result-btn"
                        onClick={() => addInterest(interest)}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  </>
                )}
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="profile-actions">
            <button
              className="btn-save"
              onClick={handleSavePreferences}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
            <button className="btn-logout" onClick={handleNewStranger}>
              {isGuestUser ? 'New Stranger' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
