import { useCallback } from 'react';
import { GameAPI } from '../../../lib/gameApi';
import { MoveAction } from '../../../types/game';
import { BOARD_CONSTANTS, indexToPosition } from '../constants';
import { calcPosRect } from '../utils';

interface CanvasInteractionDependencies {
  // 読み取り専用状態
  userInteractionEnabled: boolean;
  gameState: any;
  selectedPiecePosition: number | null;
  highlightedCells: number[];
  highlightedPieces: number[];
  currentPlayer: any;
  
  // 状態更新関数（最小限）
  updateBoardFromGameState: (gameState: any) => void;
  showErrorMessage: (message: string) => void;
  
  // UI状態更新関数
  setSelectedPiecePosition: (position: number | null) => void;
  setLiftedPieces: (pieces: number[]) => void;
  setHighlightedPieces: (pieces: number[]) => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
  clearAllHighlights: () => void;
  
  // 非同期操作
  highlightMovementDestinations: (position: any) => Promise<void>;
}

export const useCanvasInteraction = (deps: CanvasInteractionDependencies) => {
  const {
    userInteractionEnabled,
    gameState,
    selectedPiecePosition,
    highlightedCells,
    highlightedPieces,
    currentPlayer,
    updateBoardFromGameState,
    showErrorMessage,
    setSelectedPiecePosition,
    setLiftedPieces,
    setHighlightedPieces,
    setUserInteractionEnabled,
    clearAllHighlights,
    highlightMovementDestinations,
  } = deps;

  // ローカル関数: クリック座標から位置インデックスを取得
  const getClickedPositionIndex = useCallback((canvas: HTMLCanvasElement, clickX: number, clickY: number): number => {
    return Array.from({ length: 8 }).findIndex((_, posIndex) => {
      const { x, y, width, height } = calcPosRect(canvas, BOARD_CONSTANTS.PIECE_WIDTH, posIndex);
      return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height;
    });
  }, []);

  // ローカル関数: 移動アクションの実行
  const executeMoveAction = useCallback(async (fromPosition: any, toPosition: any) => {
    const moveAction: MoveAction = {
      Move: { from: fromPosition, to: toPosition }
    };
    
    console.log('移動アクションを実行:', moveAction);
    const newGameState = await GameAPI.makeMove(moveAction);
    console.log('移動後の新しいゲーム状態:', newGameState);
    
    updateBoardFromGameState(newGameState);
    clearAllHighlights();
    setSelectedPiecePosition(null);
    setUserInteractionEnabled(false); // AI の手番まで無効化
  }, [updateBoardFromGameState, clearAllHighlights, setSelectedPiecePosition, setUserInteractionEnabled]);

  // ローカル関数: 配置アクションの実行
  const executePlaceAction = useCallback(async (position: any, player: any) => {
    const placeAction: MoveAction = {
      Place: { position, player }
    };
    
    console.log('配置アクションを実行:', placeAction);
    const newGameState = await GameAPI.makeMove(placeAction);
    console.log('配置後の新しいゲーム状態:', newGameState);
    
    updateBoardFromGameState(newGameState);
    clearAllHighlights();
    setUserInteractionEnabled(false); // AI の手番まで無効化
  }, [updateBoardFromGameState, clearAllHighlights, setUserInteractionEnabled]);

  // ローカル関数: 選択状態のクリア
  const clearSelection = useCallback(() => {
    setSelectedPiecePosition(null);
    clearAllHighlights();
    // プレイヤーターンの再初期化は上位で行う
  }, [setSelectedPiecePosition, clearAllHighlights]);

  // ローカル関数: コマの選択
  const selectPiece = useCallback(async (posIndex: number, position: any) => {
    setSelectedPiecePosition(posIndex);
    setLiftedPieces([posIndex]);
    setHighlightedPieces([]); // コマのハイライトをクリア
    await highlightMovementDestinations(position);
  }, [setSelectedPiecePosition, setLiftedPieces, setHighlightedPieces, highlightMovementDestinations]);

  const handleCanvasClick = useCallback(async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!userInteractionEnabled || !gameState) return;
    
    const canvas = event.currentTarget;
    if (!canvas) return;

    // キャンバス上のクリック座標を取得
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // クリックされた位置を判定
    const clickedPosIndex = getClickedPositionIndex(canvas, clickX, clickY);
    if (clickedPosIndex === -1) return;
    
    const clickedPosition = indexToPosition(clickedPosIndex);

    try {
      // 移動元が選択されている場合
      if (selectedPiecePosition !== null) {
        const fromPosition = indexToPosition(selectedPiecePosition);
        
        if (highlightedCells.includes(clickedPosIndex)) {
          await executeMoveAction(fromPosition, clickedPosition);
        } else {
          clearSelection();
        }
      } else {
        // 配置可能なマスがクリックされた場合
        if (highlightedCells.includes(clickedPosIndex)) {
          await executePlaceAction(clickedPosition, currentPlayer);
        }
        // 移動可能なコマがクリックされた場合
        else if (highlightedPieces.includes(clickedPosIndex)) {
          await selectPiece(clickedPosIndex, clickedPosition);
        }
      }
    } catch (error) {
      console.error('手の実行に失敗しました:', error);
      showErrorMessage('手の実行に失敗しました');
      // エラー時の状態復元は上位で行う
    }
  }, [
    userInteractionEnabled,
    gameState,
    selectedPiecePosition,
    highlightedCells,
    highlightedPieces,
    currentPlayer,
    getClickedPositionIndex,
    executeMoveAction,
    executePlaceAction,
    clearSelection,
    selectPiece,
    showErrorMessage,
  ]);

  return { handleCanvasClick };
}; 