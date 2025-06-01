import { useState, useCallback } from 'react';
import { MoveAction, Position } from '../../../types/game';
import { GameAPI } from '../../../lib/gameApi';
import { positionToIndex } from '../constants';

/**
 * UI表示状態（ハイライト、エフェクト、視覚的フィードバック）を管理するhook
 */
export const useUIState = () => {
  // UI表示状態
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [highlightedPieces, setHighlightedPieces] = useState<number[]>([]);
  const [liftedPieces, setLiftedPieces] = useState<number[]>([]);
  const [isSecondBestShown, setIsSecondBestShown] = useState<boolean>(false);

  // ハイライト管理関数
  const updateHighlightsFromLegalMoves = useCallback((legalMoves: MoveAction[]) => {
    const placeCells: number[] = [];
    const movePieces: number[] = [];
    
    legalMoves.forEach(move => {
      if ('Place' in move) {
        const posIndex = positionToIndex(move.Place.position);
        placeCells.push(posIndex);
      } else if ('Move' in move) {
        const fromIndex = positionToIndex(move.Move.from);
        movePieces.push(fromIndex);
      }
    });
    
    setHighlightedCells(placeCells);
    setHighlightedPieces(movePieces);
  }, []);

  const highlightMovementDestinations = useCallback(async (fromPosition: Position, onError: (message: string) => void) => {
    try {
      const legalMoves = await GameAPI.getLegalMoves();
      const destinations: number[] = [];
      
      legalMoves.forEach(move => {
        if ('Move' in move && move.Move.from === fromPosition) {
          const toIndex = positionToIndex(move.Move.to);
          destinations.push(toIndex);
        }
      });
      
      setHighlightedCells(destinations);
    } catch (error) {
      console.error('移動先の取得に失敗しました:', error);
      onError('移動先の取得に失敗しました');
    }
  }, []);

  const clearAllHighlights = useCallback(() => {
    setHighlightedCells([]);
    setHighlightedPieces([]);
    setLiftedPieces([]);
  }, []);

  return {
    // 状態
    highlightedCells,
    highlightedPieces,
    liftedPieces,
    isSecondBestShown,
    
    // 状態更新関数
    setHighlightedCells,
    setHighlightedPieces,
    setLiftedPieces,
    setIsSecondBestShown,
    
    // ハイライト管理関数
    updateHighlightsFromLegalMoves,
    highlightMovementDestinations,
    clearAllHighlights,
  };
}; 