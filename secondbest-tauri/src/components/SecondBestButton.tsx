import React from 'react';
import './SecondBestButton.css';
import { GameAPI } from '../lib/gameApi';
import { BOARD_CONSTANTS } from './board/constants';

interface SecondBestButtonProps {
  userInteractionEnabled: boolean;
  canDeclareSecondBest: boolean;
  showSecondBest: (duration: number) => void;
  updateBoardFromGameState: (gameState: any) => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
}

const SecondBestButton: React.FC<SecondBestButtonProps> = ({ userInteractionEnabled, canDeclareSecondBest, showSecondBest, updateBoardFromGameState, setUserInteractionEnabled }) => {

  const onClick = async () => {
    if (!userInteractionEnabled) return;
    if (!canDeclareSecondBest) return;
    showSecondBest(BOARD_CONSTANTS.SECOND_BEST_DURATION);
    const newState = await GameAPI.declareSecondBest();
    updateBoardFromGameState(newState);
    setUserInteractionEnabled(false);
  }

  return (
    <button className="second-best-button" onClick={onClick}>
      Second Best!
    </button>
  );
};

export default SecondBestButton; 