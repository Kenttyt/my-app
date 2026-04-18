import { useState, useEffect } from 'react';
import { chatService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/RoomList.css';

export default function RoomList({ onRoomSelect, selectedRoom, currentInterestQuery = '' }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState('');
  const [deleteMenuRoomId, setDeleteMenuRoomId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.room-item-actions')) {
        setDeleteMenuRoomId('');
      }
    };

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await chatService.getRooms();
      setRooms(response.data.rooms || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const roomName = newRoomName.trim();
    const roomInterest = currentInterestQuery.trim() || roomName;

    if (!roomName) {
      return;
    }

    try {
      setCreating(true);
      setError('');
      const response = await chatService.createRoom(roomName, roomInterest);

      if (response?.data?.room) {
        onRoomSelect(response.data.room);
      }

      setNewRoomName('');
      setShowCreateForm(false);
      await fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (event, room) => {
    event.stopPropagation();

    try {
      setDeletingRoomId(room.id);
      setError('');
      await chatService.deleteRoom(room.id);

      if (selectedRoom?.id === room.id) {
        onRoomSelect(null);
      }

      setDeleteMenuRoomId('');
      await fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room');
    } finally {
      setDeletingRoomId('');
    }
  };

  return (
    <div className="room-list">
      <div className="room-list-header">
        <h2>{currentInterestQuery ? `Results for "${currentInterestQuery}"` : 'All Interests'}</h2>
        <button
          className="btn-create"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          + New Room
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateRoom} className="create-room-form">
          <input
            type="text"
            placeholder="Room name"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newRoomName.trim()}>
            {creating ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="btn-cancel"
          >
            Cancel
          </button>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading rooms...</div>
      ) : rooms.filter((room) => {
        if (!currentInterestQuery.trim()) {
          return true;
        }

        const query = currentInterestQuery.trim().toLowerCase();
        const roomInterest = String(room.interest || room.sport || '').toLowerCase();
        const roomName = String(room.name || '').toLowerCase();
        return roomInterest.includes(query) || roomName.includes(query);
      }).length === 0 ? (
        <div className="empty-state">No rooms yet. Create one!</div>
      ) : (
        <div className="rooms">
          {rooms
            .filter((room) => {
              if (!currentInterestQuery.trim()) {
                return true;
              }

              const query = currentInterestQuery.trim().toLowerCase();
              const roomInterest = String(room.interest || room.sport || '').toLowerCase();
              const roomName = String(room.name || '').toLowerCase();
              return roomInterest.includes(query) || roomName.includes(query);
            })
            .map(room => (
            <div
              key={room.id}
              className={`room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
              onClick={() => onRoomSelect(room)}
            >
              <div className="room-item-row">
                <div className="room-info">
                  <h3>{room.name}</h3>
                  <span className="member-count">👥 {room.memberCount}</span>
                </div>

                {room.creator === user?.id && (
                  <div className="room-item-actions" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-room-menu"
                      onClick={() => setDeleteMenuRoomId((prev) => (prev === room.id ? '' : room.id))}
                      aria-label="Room actions"
                      title="Room actions"
                    >
                      :
                    </button>

                    {deleteMenuRoomId === room.id && (
                      <div className="room-actions-popout">
                        <button
                          type="button"
                          className="btn-delete-room"
                          onClick={(event) => handleDeleteRoom(event, room)}
                          disabled={deletingRoomId === room.id}
                        >
                          {deletingRoomId === room.id ? 'Deleting...' : 'Delete room'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
