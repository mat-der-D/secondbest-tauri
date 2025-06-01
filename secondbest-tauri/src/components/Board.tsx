import React, { useRef, useEffect } from 'react';
import './Board.css';
import { BOARD_CONSTANTS } from './board/constants';
import { useImageLoader } from './board/hooks/useImageLoader';
import { Piece } from './board/constants';
import {
  drawBackground,
  drawHighlightedCells,
  drawPieces,
  drawPieceFrames,
  drawSecondBest,
} from './board/drawing';

// Boardコンポーネントのpropsインターフェース
interface BoardProps {
  pieces: Piece[];
  highlightedCells: number[];
  highlightedPieces: number[];
  liftedPieces: number[];
  isSecondBestShown: boolean;
  errorMessage: string;
  onCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => Promise<void>;
  onInitializeGame: () => Promise<void>;
}

// メインコンポーネント
const Board: React.FC<BoardProps> = ({
  pieces,
  highlightedCells,
  highlightedPieces,
  liftedPieces,
  isSecondBestShown: isSecondBestShown,
  errorMessage,
  onCanvasClick,
  onInitializeGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useImageLoader();

  // ゲーム初期化
  useEffect(() => {
    onInitializeGame();
  }, [onInitializeGame]);

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
    
    if (isSecondBestShown) {
      drawSecondBest(ctx, canvas, images.secondBest!);
    }
  }, [pieces, images, highlightedCells, highlightedPieces, liftedPieces, isSecondBestShown]);

  return (
    <div className="board-container">
      <canvas 
        ref={canvasRef}
        className="board-canvas"
        width={BOARD_CONSTANTS.CANVAS_WIDTH}
        height={BOARD_CONSTANTS.CANVAS_HEIGHT}
        onClick={onCanvasClick}
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