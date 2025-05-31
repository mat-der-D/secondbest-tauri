import { useGameCore } from './useGameCore';
import { useUIState } from './useUIState';
import { useUserInteraction } from './useUserInteraction';
import { useErrorHandling } from './useErrorHandling';
import { useGameFlow } from './useGameFlow';

/**
 * 分割されたゲーム状態管理hookを統合するメインhook
 * 各専門領域のhookを組み合わせて、統一されたインターフェースを提供
 */
export const useGameState = () => {
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

  // 依存関係を持つ関数をラップ
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

  return {
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
    initializePlayerTurn: gameFlow.initializePlayerTurn,
    highlightAlternativeMoves: gameFlow.highlightAlternativeMoves,
    showSecondBestOption: userInteraction.showSecondBestOption,
  };
}; 