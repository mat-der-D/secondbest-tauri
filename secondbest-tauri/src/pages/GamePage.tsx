import React from 'react';
import SecondBestButton from '../components/SecondBestButton';
import Board from '../components/Board';
import StatusDisplay from '../components/StatusDisplay';
import './GamePage.css';

interface GamePageProps {
  onHomeClick: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ onHomeClick }) => {
  return (
    <div className="game-page">
      <div className="game-header">
        <div className="game-buttons">
          <button className="home-button" onClick={onHomeClick}>
            🏠
          </button>
          <button className="refresh-button">
            🔄
          </button>
        </div>
      </div>
      
      <div className="game-content">
        <SecondBestButton />
        <Board />
        <StatusDisplay />
      </div>
    </div>
  );
};

export default GamePage; 