import React from 'react';
import SecondBestButton from '../components/SecondBestButton';
import Board from '../components/Board';
import StatusDisplay from '../components/StatusDisplay';
import { useBoardController } from '../components/board/hooks/useBoardController';
import './GamePage.css';

interface GamePageProps {
  onHomeClick: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ onHomeClick }) => {
  // ボードの状態をGamePageで管理
  const boardController = useBoardController();

  const onRefreshClick = () => {
    if (!boardController.userInteractionEnabled) return;
    boardController.clearSecondBest();
    boardController.initializeGame();
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <div className="game-buttons">
          <button className="home-button" onClick={onHomeClick}>
            🏠
          </button>
          <button className="refresh-button" onClick={onRefreshClick}>
            🔄
          </button>
        </div>
      </div>
      
      <div className="game-content">
        <SecondBestButton />
        <Board 
          pieces={boardController.pieces}
          highlightedCells={boardController.highlightedCells}
          highlightedPieces={boardController.highlightedPieces}
          liftedPieces={boardController.liftedPieces}
          isSecondBestShown={boardController.isSecondBestShown}
          errorMessage={boardController.errorMessage}
          onCanvasClick={boardController.handleCanvasClick}
          onInitializeGame={boardController.initializeGame}
        />
        <StatusDisplay />
      </div>
    </div>
  );
};

export default GamePage; 