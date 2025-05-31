import { useState, useCallback } from 'react';
import { TurnPhase } from '../../../types/game';

/**
 * ユーザー操作状態（選択状態、操作制御、インタラクション管理）を管理するhook
 */
export const useUserInteraction = () => {
  // ユーザー操作状態
  const [userInteractionEnabled, setUserInteractionEnabled] = useState<boolean>(true);
  const [selectedPiecePosition, setSelectedPiecePosition] = useState<number | null>(null);

  // UI制御関数
  const enableNormalMoveUI = useCallback((setTurnPhase: (phase: TurnPhase) => void) => {
    setUserInteractionEnabled(true);
    setTurnPhase(TurnPhase.WaitingForMove);
  }, []);

  const disableUserInteraction = useCallback((clearAllHighlights: () => void) => {
    setUserInteractionEnabled(false);
    clearAllHighlights();
  }, []);

  const showSecondBestOption = useCallback(() => {
    // TODO: Second Best宣言ボタンの表示
    console.log('Second Best宣言が可能です');
  }, []);

  const promptForAlternativeMove = useCallback((clearAllHighlights: () => void) => {
    // 前回の手を取り消し、代替手選択のUI表示
    setSelectedPiecePosition(null);
    clearAllHighlights();
    setUserInteractionEnabled(true); // ユーザー操作を有効化
    // TODO: ユーザーガイダンスの表示
    console.log('代替手を選択してください');
  }, []);

  return {
    // 状態
    userInteractionEnabled,
    selectedPiecePosition,
    
    // 状態更新関数
    setUserInteractionEnabled,
    setSelectedPiecePosition,
    
    // UI制御関数
    enableNormalMoveUI,
    disableUserInteraction,
    showSecondBestOption,
    promptForAlternativeMove,
  };
}; 