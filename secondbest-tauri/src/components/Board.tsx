import React, { useRef, useEffect } from 'react';
import './Board.css';
import { BOARD_CONSTANTS } from './board/constants';
import { useImageLoader } from './board/hooks/useImageLoader';
import { useGameState } from './board/hooks/useGameState';
import { useGameEvents } from './board/hooks/useGameEvents';
import { useCanvasInteraction } from './board/hooks/useCanvasInteraction';
import {
  drawBackground,
  drawHighlightedCells,
  drawPieces,
  drawPieceFrames,
  drawSecondBest,
} from './board/drawing';

// メインコンポーネント
const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useImageLoader();
  
  // ゲーム状態管理
  const gameStateHook = useGameState();
  const {
    gameState,
    currentPlayer,
    userInteractionEnabled,
    pieces,
    highlightedCells,
    highlightedPieces,
    liftedPieces,
    showSecondBest,
    selectedPiecePosition,
    errorMessage,
    setLiftedPieces,
    setShowSecondBest,
    setSelectedPiecePosition,
    setUserInteractionEnabled,
    setTurnPhase,
    highlightMovementDestinations,
    clearAllHighlights,
    initializePlayerTurn,
    updateBoardFromGameState,
    promptForAlternativeMove,
    highlightAlternativeMoves,
    enableNormalMoveUI,
    disableUserInteraction,
    showSecondBestOption,
    showErrorMessage,
    revertToLastValidState,
    initializeGame,
  } = gameStateHook;

  // ゲームイベント処理
  useGameEvents({
    updateBoardFromGameState,
    initializePlayerTurn,
    setShowSecondBest,
    promptForAlternativeMove,
    highlightAlternativeMoves,
    setUserInteractionEnabled,
    setTurnPhase,
    disableUserInteraction,
    enableNormalMoveUI,
    showSecondBestOption,
    showErrorMessage,
    revertToLastValidState,
  });

  // キャンバス操作処理
  const { handleCanvasClick } = useCanvasInteraction({
    userInteractionEnabled,
    gameState,
    selectedPiecePosition,
    highlightedCells,
    highlightedPieces,
    currentPlayer,
    setSelectedPiecePosition,
    setLiftedPieces,
    setHighlightedPieces: gameStateHook.setHighlightedPieces,
    updateBoardFromGameState,
    clearAllHighlights,
    setUserInteractionEnabled,
    highlightMovementDestinations,
    initializePlayerTurn,
    showErrorMessage,
    revertToLastValidState,
  });

  // ゲーム初期化
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // 描画処理を統合したuseEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !Object.values(images).every(img => img)) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 各描画処理を順次実行
    drawBackground(ctx, canvas, images.board!);
    drawHighlightedCells(ctx, canvas, highlightedCells, images.cellFrame!, BOARD_CONSTANTS.CELL_WIDTH);
    
    const posMaxHeightMap = drawPieces(
      ctx, canvas, pieces, images, liftedPieces, 
      BOARD_CONSTANTS.PIECE_WIDTH, BOARD_CONSTANTS.PIECE_LIFT_OFFSET_RATIO
    );
    
    drawPieceFrames(
      ctx, canvas, highlightedPieces, posMaxHeightMap, liftedPieces,
      images.pieceFrame!, BOARD_CONSTANTS.PIECE_WIDTH, BOARD_CONSTANTS.PIECE_LIFT_OFFSET_RATIO
    );
    
    if (showSecondBest) {
      drawSecondBest(ctx, canvas, images.secondBest!);
    }
  }, [pieces, images, highlightedCells, highlightedPieces, liftedPieces, showSecondBest]);

  return (
    <div className="board-container">
      <canvas 
        ref={canvasRef}
        className="board-canvas"
        width={BOARD_CONSTANTS.CANVAS_WIDTH}
        height={BOARD_CONSTANTS.CANVAS_HEIGHT}
        onClick={handleCanvasClick}
      />
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default Board; 