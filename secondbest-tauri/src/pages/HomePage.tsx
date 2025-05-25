import React from 'react';
import './HomePage.css';

interface HomePageProps {
  onStartClick: () => void;
  onSettingsClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartClick, onSettingsClick }) => {
  return (
    <div className="home-page">
      <div className="home-header">
        <button className="settings-button" onClick={onSettingsClick}>
          ⚙️
        </button>
      </div>
      
      <div className="home-content">
        <h1 className="app-title">Second Best</h1>
        <button className="start-button" onClick={onStartClick}>
          Start
        </button>
      </div>
    </div>
  );
};

export default HomePage; 