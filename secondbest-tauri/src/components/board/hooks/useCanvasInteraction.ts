import { useCallback } from 'react';
import { GameAPI } from '../../../lib/gameApi';
import { MoveAction } from '../../../types/game';
import { BOARD_CONSTANTS, indexToPosition } from '../constants';
import { calcPosRect } from '../utils';

interface UseCanvasInteractionProps {
  userInteractionEnabled: boolean;
  gameState: any;
  selectedPiecePosition: number | null;
  highlightedCells: number[];
  highlightedPieces: number[];
  currentPlayer: any;
  setSelectedPiecePosition: (position: number | null) => void;
  setLiftedPieces: (pieces: number[]) => void;
  setHighlightedPieces: (pieces: number[]) => void;
  updateBoardFromGameState: (gameState: any) => void;
  clearAllHighlights: () => void;
  setUserInteractionEnabled: (enabled: boolean) => void;
  highlightMovementDestinations: (position: any) => Promise<void>;
  initializePlayerTurn: () => void;
  showErrorMessage: (message: string) => void;
  revertToLastValidState: () => void;
}

export const useCanvasInteraction = ({
  userInteractionEnabled,
  gameState,
  selectedPiecePosition,
  highlightedCells,
  highlightedPieces,
  currentPlayer,
  setSelectedPiecePosition,
  setLiftedPieces,
  setHighlightedPieces,
  updateBoardFromGameState,
  clearAllHighlights,
  setUserInteractionEnabled,
  highlightMovementDestinations,
  initializePlayerTurn,
  showErrorMessage,
  revertToLastValidState,
}: UseCanvasInteractionProps) => {

  const handleCanvasClick = useCallback(async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!userInteractionEnabled || !gameState) return;
    
    const canvas = event.currentTarget;
    if (!canvas) return;

    // キャンバス上のクリック座標を取得
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // どのposIndexの領域内がクリックされたかを判定
    const clickedPosIndex = Array.from({ length: 8 }).findIndex((_, posIndex) => {
      const { x, y, width, height } = calcPosRect(canvas, BOARD_CONSTANTS.PIECE_WIDTH, posIndex);
      return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height;
    });

    // クリックされた位置が領域内にない場合は何もしない
    if (clickedPosIndex === -1) return;
    
    const clickedPosition = indexToPosition(clickedPosIndex);

    try {
      // 移動元が選択されている場合
      if (selectedPiecePosition !== null) {
        const fromPosition = indexToPosition(selectedPiecePosition);
        
        // 移動先として有効かチェック
        if (highlightedCells.includes(clickedPosIndex)) {
          const moveAction: MoveAction = {
            Move: { from: fromPosition, to: clickedPosition }
          };
          
          console.log('移動アクションを実行:', moveAction);
          const newGameState = await GameAPI.makeMove(moveAction);
          console.log('移動後の新しいゲーム状態:', newGameState);
          
          // 即座にボード状態を更新
          updateBoardFromGameState(newGameState);
          clearAllHighlights();
          setSelectedPiecePosition(null);
          setUserInteractionEnabled(false); // AI の手番まで無効化
        } else {
          // 無効な移動先の場合、選択をクリア
          setSelectedPiecePosition(null);
          clearAllHighlights();
          initializePlayerTurn();
        }
      } else {
        // 配置可能なマスがクリックされた場合
        if (highlightedCells.includes(clickedPosIndex)) {
          const placeAction: MoveAction = {
            Place: { position: clickedPosition, player: currentPlayer }
          };
          
          console.log('配置アクションを実行:', placeAction);
          const newGameState = await GameAPI.makeMove(placeAction);
          console.log('配置後の新しいゲーム状態:', newGameState);
          
          // 即座にボード状態を更新
          updateBoardFromGameState(newGameState);
          clearAllHighlights();
          setUserInteractionEnabled(false); // AI の手番まで無効化
        }
        // 移動可能なコマがクリックされた場合
        else if (highlightedPieces.includes(clickedPosIndex)) {
          setSelectedPiecePosition(clickedPosIndex);
          setLiftedPieces([clickedPosIndex]);
          setHighlightedPieces([]); // コマのハイライトをクリア
          await highlightMovementDestinations(clickedPosition);
        }
      }
    } catch (error) {
      console.error('手の実行に失敗しました:', error);
      showErrorMessage('手の実行に失敗しました');
      revertToLastValidState();
    }
  }, [
    userInteractionEnabled,
    gameState,
    selectedPiecePosition,
    highlightedCells,
    highlightedPieces,
    currentPlayer,
    setSelectedPiecePosition,
    setLiftedPieces,
    setHighlightedPieces,
    updateBoardFromGameState,
    clearAllHighlights,
    setUserInteractionEnabled,
    highlightMovementDestinations,
    initializePlayerTurn,
    showErrorMessage,
    revertToLastValidState,
  ]);

  return { handleCanvasClick };
}; 