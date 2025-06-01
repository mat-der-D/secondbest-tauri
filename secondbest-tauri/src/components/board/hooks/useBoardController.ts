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
  
  const revertToLastValidState = async () => {
    await gameCore.revertToLastValidState();
    uiState.clearAllHighlights();
  };

  // ゲームイベント処理（必要最小限の依存関係のみ渡す）
  useGameEvents({
    updateBoardFromGameState: gameCore.updateBoardFromGameState,
    showSecondBest: uiState.showSecondBest,
    setTurnPhase: gameCore.setTurnPhase,
    setUserInteractionEnabled: userInteraction.setUserInteractionEnabled,
    showErrorMessage: errorHandling.showErrorMessage,
    initializePlayerTurn: gameFlow.initializePlayerTurn,
    clearAllHighlights: uiState.clearAllHighlights,
    revertToLastValidState,
  });

  // キャンバス操作処理（必要最小限の依存関係のみ渡す）
  const canvasInteraction = useCanvasInteraction({
    userInteractionEnabled: userInteraction.userInteractionEnabled,
    selectedPiecePosition: userInteraction.selectedPiecePosition,
    highlightedCells: uiState.highlightedCells,
    highlightedPieces: uiState.highlightedPieces,
    currentPlayer: gameCore.currentPlayer,
    updateBoardFromGameState: gameCore.updateBoardFromGameState,
    showErrorMessage: errorHandling.showErrorMessage,
    setSelectedPiecePosition: userInteraction.setSelectedPiecePosition,
    setLiftedPieces: uiState.setLiftedPieces,
    setHighlightedPieces: uiState.setHighlightedPieces,
    setUserInteractionEnabled: userInteraction.setUserInteractionEnabled,
    clearAllHighlights: uiState.clearAllHighlights,
    highlightMovementDestinations,
  });

  // Board.tsxで必要な値のみを返す
  return {
    // 描画に必要な状態
    pieces: gameCore.pieces,
    canDeclareSecondBest: gameCore.canDeclareSecondBest,
    highlightedCells: uiState.highlightedCells,
    highlightedPieces: uiState.highlightedPieces,
    liftedPieces: uiState.liftedPieces,
    isSecondBestShown: uiState.isSecondBestShown,
    errorMessage: errorHandling.errorMessage,
    
    // 操作に必要な関数
    initializeGame: gameFlow.initializeGameWithErrorHandling,
    handleCanvasClick: canvasInteraction.handleCanvasClick,
    
    // 追加の状態と関数
    showSecondBest: uiState.showSecondBest,
    clearSecondBest: uiState.clearSecondBest,
    userInteractionEnabled: userInteraction.userInteractionEnabled,
    updateBoardFromGameState: gameCore.updateBoardFromGameState,
    setUserInteractionEnabled: userInteraction.setUserInteractionEnabled,
    clearAllHighlights: uiState.clearAllHighlights,
  };
}; 