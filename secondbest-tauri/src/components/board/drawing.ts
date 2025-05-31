import { Piece, Images } from './constants';
import { adjustSize, calcPosCenter, calcPieceCoordinate } from './utils';

// 描画関数群
export const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, boardImage: HTMLImageElement) => {
  const { width: drawWidth, height: drawHeight } = adjustSize(
    boardImage.width,
    boardImage.height,
    canvas.width
  );
  
  const offsetX = (canvas.width - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;
  
  ctx.drawImage(boardImage, offsetX, offsetY, drawWidth, drawHeight);
};

export const drawHighlightedCells = (
  ctx: CanvasRenderingContext2D, 
  canvas: HTMLCanvasElement, 
  highlightedCells: number[], 
  cellFrameImage: HTMLImageElement,
  cellWidth: number
) => {
  highlightedCells.forEach(posIndex => {
    const { x, y } = calcPosCenter(canvas, posIndex);
    const { width: drawCellWidth, height: drawCellHeight } = adjustSize(
      cellFrameImage.width,
      cellFrameImage.height,
      cellWidth
    );
    
    ctx.drawImage(
      cellFrameImage,
      x - drawCellWidth / 2,
      y - drawCellHeight / 2,
      drawCellWidth,
      drawCellHeight
    );
  });
};

export const drawPieces = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  pieces: Piece[],
  images: Images,
  liftedPieces: number[],
  pieceWidth: number,
  pieceLifeOffsetRatio: number
) => {
  const posMaxHeightMap = new Map<number, number>();
  
  // 各位置における最大のheightIndexを計算
  pieces.forEach(piece => {
    const currentMax = posMaxHeightMap.get(piece.posIndex) || -1;
    if (piece.heightIndex > currentMax) {
      posMaxHeightMap.set(piece.posIndex, piece.heightIndex);
    }
  });

  // 配置された駒を描画
  pieces.forEach(piece => {
    const isTopPiece = piece.heightIndex === posMaxHeightMap.get(piece.posIndex);
    const liftOffset = isTopPiece && liftedPieces.includes(piece.posIndex) ? pieceLifeOffsetRatio : 0;
    
    const { x, y } = calcPieceCoordinate(canvas, pieceWidth, piece, liftOffset);
    const pieceImage = piece.color === 'W' ? images.pieceWhite : images.pieceBlack;
    
    if (pieceImage) {
      const { width: drawPieceWidth, height: drawPieceHeight } = adjustSize(
        pieceImage.width,
        pieceImage.height,
        pieceWidth
      );
      
      ctx.drawImage(
        pieceImage,
        x - drawPieceWidth / 2,
        y - drawPieceHeight / 2,
        drawPieceWidth,
        drawPieceHeight
      );
    }
  });

  return posMaxHeightMap;
};

export const drawPieceFrames = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  highlightedPieces: number[],
  posMaxHeightMap: Map<number, number>,
  liftedPieces: number[],
  pieceFrameImage: HTMLImageElement,
  pieceWidth: number,
  pieceLifeOffsetRatio: number
) => {
  highlightedPieces.forEach(posIndex => {
    const maxHeight = posMaxHeightMap.get(posIndex);
    if (maxHeight !== undefined) {
      const topPiece: Piece = { posIndex, heightIndex: maxHeight, color: 'W' };
      const liftOffset = liftedPieces.includes(posIndex) ? pieceLifeOffsetRatio : 0;
      const { x, y } = calcPieceCoordinate(canvas, pieceWidth, topPiece, liftOffset);
      
      const { width: drawFrameWidth, height: drawFrameHeight } = adjustSize(
        pieceFrameImage.width,
        pieceFrameImage.height,
        pieceWidth
      );
      
      ctx.drawImage(
        pieceFrameImage,
        x - drawFrameWidth / 2,
        y - drawFrameHeight / 2,
        drawFrameWidth,
        drawFrameHeight
      );
    }
  });
};

export const drawSecondBest = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  secondBestImage: HTMLImageElement
) => {
  const { width: drawSecondBestWidth, height: drawSecondBestHeight } = adjustSize(
    secondBestImage.width,
    secondBestImage.height,
    canvas.width
  );
  
  const secondBestOffsetX = (canvas.width - drawSecondBestWidth) / 2;
  const secondBestOffsetY = (canvas.height - drawSecondBestHeight) / 2;
  
  ctx.drawImage(
    secondBestImage,
    secondBestOffsetX,
    secondBestOffsetY,
    drawSecondBestWidth,
    drawSecondBestHeight
  );
}; 