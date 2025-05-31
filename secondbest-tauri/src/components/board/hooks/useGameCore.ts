import { useState, useCallback } from 'react';
import { GameState, Player, TurnPhase, Position } from '../../../types/game';
import { GameAPI } from '../../../lib/gameApi';
import { Piece, positionToIndex, playerToColor } from '../constants';

/**
 * ゲームの基本状態（ゲーム状態、プレイヤー、フェーズ、駒配置）を管理するhook
 */
export const useGameCore = () => {
  // ゲーム基本状態
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Black);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>(TurnPhase.WaitingForMove);
  const [pieces, setPieces] = useState<Piece[]>([]);

  // ゲーム状態更新
  const updateBoardFromGameState = useCallback((newGameState: GameState) => {
    console.log('ゲーム状態を更新中:', newGameState);
    setGameState(newGameState);
    setCurrentPlayer(newGameState.current_player);
    setTurnPhase(newGameState.turn_phase);
    
    // GameStateからPiece配列を生成
    const newPieces: Piece[] = [];
    Object.entries(newGameState.board).forEach(([positionStr, pieceStack]) => {
      const position = positionStr as Position;
      const posIndex = positionToIndex(position);
      
      pieceStack.pieces.forEach((player, heightIndex) => {
        newPieces.push({
          posIndex,
          heightIndex,
          color: playerToColor(player)
        });
      });
    });
    
    console.log('新しいpieces配列:', newPieces);
    setPieces(newPieces);
  }, []);

  // 状態復元
  const revertToLastValidState = useCallback(async () => {
    try {
      const currentGameState = await GameAPI.getGameState();
      updateBoardFromGameState(currentGameState);
    } catch (error) {
      console.error('状態の復元に失敗しました:', error);
    }
  }, [updateBoardFromGameState]);

  // ゲーム初期化
  const initializeGame = useCallback(async () => {
    try {
      const initialGameState = await GameAPI.newGame();
      updateBoardFromGameState(initialGameState);
    } catch (error) {
      console.error('ゲームの初期化に失敗しました:', error);
      throw error; // エラーを上位に伝播
    }
  }, [updateBoardFromGameState]);

  return {
    // 状態
    gameState,
    currentPlayer,
    turnPhase,
    pieces,
    
    // 状態更新関数
    setTurnPhase,
    updateBoardFromGameState,
    revertToLastValidState,
    initializeGame,
  };
}; 