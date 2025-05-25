import React from 'react';
import './SettingsPage.css';

interface SettingsPageProps {
  onHomeClick: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onHomeClick }) => {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="home-button" onClick={onHomeClick}>
          🏠
        </button>
      </div>
      
      <div className="settings-content">
        <h2 className="settings-title">設定</h2>
        <div className="settings-area">
          <p className="settings-placeholder">設定項目はここに表示されます</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 