import { useGameState } from './useGameState';
import { useGameEvents } from './useGameEvents';
import { useCanvasInteraction } from './useCanvasInteraction';

/**
 * Board コンポーネントの全体的な状態とロジックを統合管理するhook
 */
export const useBoardController = () => {
  // ゲーム状態管理（中心となるhook）
  const gameState = useGameState();

  // ゲームイベント処理（gameStateを参照）
  useGameEvents(gameState);

  // キャンバス操作処理（gameStateを参照）
  const canvasInteraction = useCanvasInteraction(gameState);

  return {
    // ゲーム状態
    ...gameState,
    // キャンバス操作
    ...canvasInteraction,
  };
}; 