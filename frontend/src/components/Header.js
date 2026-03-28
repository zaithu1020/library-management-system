// src/components/Header.js
import React, { useState } from 'react';
import './Header.css';

const Header = ({ logo, onLogout, onChangePassword, onManageUsers, userRole, username }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-container">
          <img src={logo} alt="Institute Logo" className="header-logo" />
          <h1 className="header-title">📚 Library Management System</h1>
        </div>
        
        <div className="header-actions">
          <div className="settings-dropdown">
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              👤 {username} ⚙️
            </button>
            
            {showSettings && (
              <div className="dropdown-menu">
                <button onClick={() => {
                  onChangePassword();
                  setShowSettings(false);
                }}>
                  🔑 Change Password
                </button>
                
                {userRole === 'Administrator' && (
                  <button onClick={() => {
                    onManageUsers();
                    setShowSettings(false);
                  }}>
                    👥 Manage Users
                  </button>
                )}
                
                <button onClick={onLogout}>🚪 Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;