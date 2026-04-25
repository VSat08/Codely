import { useState } from 'react';
import './UserPresence.css';

/**
 * Sidebar user list with editable nicknames.
 */
function UserPresence({ users, currentUser, onRenameUser, socketId }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const userEntries = Object.entries(users);

  const startEditing = () => {
    setEditName(currentUser?.name || '');
    setEditing(true);
  };

  const saveName = () => {
    const name = editName.trim();
    if (name && name !== currentUser?.name) {
      onRenameUser(name);
    }
    setEditing(false);
  };

  return (
    <div className="user-presence">
      <div className="presence-header">
        <h3>Users</h3>
        <span className="presence-count">{userEntries.length}</span>
      </div>

      <ul className="user-list">
        {userEntries.map(([sid, user]) => {
          const isMe = sid === socketId;

          return (
            <li key={sid} className={`user-item ${isMe ? 'is-me' : ''}`}>
              <span
                className="user-dot"
                style={{ background: user.color }}
              />

              {isMe && editing ? (
                <input
                  className="user-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  autoFocus
                  maxLength={20}
                />
              ) : (
                <span
                  className="user-name truncate"
                  onClick={isMe ? startEditing : undefined}
                  title={isMe ? 'Click to rename' : user.name}
                  style={{ cursor: isMe ? 'pointer' : 'default' }}
                >
                  {user.name}
                </span>
              )}

              {isMe && !editing && (
                <span className="you-badge">you</span>
              )}
            </li>
          );
        })}
      </ul>

      {userEntries.length > 0 && (
        <p className="presence-hint">
          {socketId && users[socketId] ? 'Click your name to rename' : ''}
        </p>
      )}
    </div>
  );
}

export default UserPresence;
