import { useGameState } from './useGameState';
import { useGameEvents } from './useGameEvents';
import { useCanvasInteraction } from './useCanvasInteraction';

/**
 * Board コンポーネントの全体的な状態とロジックを統合管理するhook
 */
export const useBoardController = () => {
  // ゲーム状態管理（中心となるhook）
  const gameState = useGameState();

  // ゲームイベント処理（必要最小限の依存関係のみ渡す）
  useGameEvents({
    updateBoardFromGameState: gameState.updateBoardFromGameState,
    setShowSecondBest: gameState.setShowSecondBest,
    setTurnPhase: gameState.setTurnPhase,
    setUserInteractionEnabled: gameState.setUserInteractionEnabled,
    showErrorMessage: gameState.showErrorMessage,
    initializePlayerTurn: gameState.initializePlayerTurn,
    clearAllHighlights: gameState.clearAllHighlights,
    revertToLastValidState: gameState.revertToLastValidState,
  });

  // キャンバス操作処理（必要最小限の依存関係のみ渡す）
  const canvasInteraction = useCanvasInteraction({
    userInteractionEnabled: gameState.userInteractionEnabled,
    gameState: gameState.gameState,
    selectedPiecePosition: gameState.selectedPiecePosition,
    highlightedCells: gameState.highlightedCells,
    highlightedPieces: gameState.highlightedPieces,
    currentPlayer: gameState.currentPlayer,
    updateBoardFromGameState: gameState.updateBoardFromGameState,
    showErrorMessage: gameState.showErrorMessage,
    setSelectedPiecePosition: gameState.setSelectedPiecePosition,
    setLiftedPieces: gameState.setLiftedPieces,
    setHighlightedPieces: gameState.setHighlightedPieces,
    setUserInteractionEnabled: gameState.setUserInteractionEnabled,
    clearAllHighlights: gameState.clearAllHighlights,
    highlightMovementDestinations: gameState.highlightMovementDestinations,
  });

  return {
    // ゲーム状態
    ...gameState,
    // キャンバス操作
    ...canvasInteraction,
  };
}; 