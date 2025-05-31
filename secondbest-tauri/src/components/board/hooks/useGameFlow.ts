import { useCallback } from 'react';
import { MoveAction } from '../../../types/game';
import { GameAPI } from '../../../lib/gameApi';

interface GameFlowDependencies {
  updateHighlightsFromLegalMoves: (legalMoves: MoveAction[]) => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
  setSelectedPiecePosition: (position: number | null) => void;
  showErrorMessage: (message: string) => void;
  initializeGame: () => Promise<void>;
}

/**
 * ゲームフロー制御（ターン管理、初期化、フロー制御）を管理するhook
 */
export const useGameFlow = ({
  updateHighlightsFromLegalMoves,
  setUserInteractionEnabled,
  setSelectedPiecePosition,
  showErrorMessage,
  initializeGame,
}: GameFlowDependencies) => {

  // プレイヤーターン初期化
  const initializePlayerTurn = useCallback(async () => {
    try {
      const legalMoves = await GameAPI.getLegalMoves();
      updateHighlightsFromLegalMoves(legalMoves);
      setUserInteractionEnabled(true);
      setSelectedPiecePosition(null);
    } catch (error) {
      console.error('プレイヤーターンの初期化に失敗しました:', error);
      showErrorMessage('ゲーム状態の取得に失敗しました');
    }
  }, [updateHighlightsFromLegalMoves, setUserInteractionEnabled, setSelectedPiecePosition, showErrorMessage]);

  // 代替手のハイライト表示
  const highlightAlternativeMoves = useCallback(async () => {
    try {
      const legalMoves = await GameAPI.getLegalMoves();
      // TODO: 前回選択した手以外の合法手をフィルタリング
      updateHighlightsFromLegalMoves(legalMoves);
      setUserInteractionEnabled(true); // ユーザー操作を有効化
    } catch (error) {
      console.error('代替手の取得に失敗しました:', error);
      showErrorMessage('代替手の取得に失敗しました');
    }
  }, [updateHighlightsFromLegalMoves, setUserInteractionEnabled, showErrorMessage]);

  // ゲーム初期化（エラーハンドリング付き）
  const initializeGameWithErrorHandling = useCallback(async () => {
    try {
      await initializeGame();
      await initializePlayerTurn();
    } catch (error) {
      console.error('ゲームの初期化に失敗しました:', error);
      showErrorMessage('ゲームの初期化に失敗しました');
    }
  }, [initializeGame, initializePlayerTurn, showErrorMessage]);

  return {
    // ゲームフロー制御関数
    initializePlayerTurn,
    highlightAlternativeMoves,
    initializeGameWithErrorHandling,
  };
}; 