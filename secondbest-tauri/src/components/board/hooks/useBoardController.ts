import { useGameCore } from './useGameCore';
import { useUIState } from './useUIState';
import { useUserInteraction } from './useUserInteraction';
import { useErrorHandling } from './useErrorHandling';
import { useGameFlow } from './useGameFlow';
import { useGameEvents } from './useGameEvents';
import { useCanvasInteraction } from './useCanvasInteraction';

/**
 * Board コンポーネントの全体的な状態とロジックを統合管理するhook
 * 各専門領域のhookを組み合わせて、統一されたインターフェースを提供
 */
export const useBoardController = () => {
  // 各専門領域のhookを初期化
  const gameCore = useGameCore();
  const uiState = useUIState();
  const userInteraction = useUserInteraction();
  const errorHandling = useErrorHandling();

  // ゲームフロー制御（他のhookに依存）
  const gameFlow = useGameFlow({
    updateHighlightsFromLegalMoves: uiState.updateHighlightsFromLegalMoves,
    setUserInteractionEnabled: userInteraction.setUserInteractionEnabled,
    setSelectedPiecePosition: userInteraction.setSelectedPiecePosition,
    showErrorMessage: errorHandling.showErrorMessage,
    initializeGame: gameCore.initializeGame,
  });

  // 統合された関数（依存関係を持つもの）
  const highlightMovementDestinations = (fromPosition: any) => 
    uiState.highlightMovementDestinations(fromPosition, errorHandling.showErrorMessage);
  
  const enableNormalMoveUI = () => 
    userInteraction.enableNormalMoveUI(gameCore.setTurnPhase);
  
  const disableUserInteraction = () => 
    userInteraction.disableUserInteraction(uiState.clearAllHighlights);
  
  const promptForAlternativeMove = () => 
    userInteraction.promptForAlternativeMove(uiState.clearAllHighlights);
  
  const revertToLastValidState = async () => {
    await gameCore.revertToLastValidState();
    uiState.clearAllHighlights();
  };

  // 統合されたゲーム状態オブジェクト
  const gameState = {
    // ゲーム基本状態
    ...gameCore,
    
    // UI表示状態
    ...uiState,
    
    // ユーザー操作状態
    ...userInteraction,
    
    // エラー処理
    ...errorHandling,
    
    // ゲームフロー制御
    ...gameFlow,
    
    // 統合された関数
    highlightMovementDestinations,
    enableNormalMoveUI,
    disableUserInteraction,
    promptForAlternativeMove,
    revertToLastValidState,
    
    // エイリアス（後方互換性のため）
    initializeGame: gameFlow.initializeGameWithErrorHandling,
    showSecondBestOption: userInteraction.showSecondBestOption,
  };

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