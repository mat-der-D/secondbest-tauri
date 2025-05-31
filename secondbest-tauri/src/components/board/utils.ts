import { Piece } from './constants';

// ユーティリティ関数
export const adjustSize = (originalWidth: number, originalHeight: number, targetWidth: number) => {
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: targetWidth,
    height: targetWidth * aspectRatio,
  };
};

export const calcPosCenter = (canvas: HTMLCanvasElement, posIndex: number) => {
  const radiusX = 0.358;
  const radiusY = radiusX * 0.8;
  const angle = (-3 * Math.PI / 8) + (Math.PI / 4) * posIndex;
  const [xBase, yBase] = [radiusX * Math.cos(angle), radiusY * Math.sin(angle)];
  
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;
  
  return { 
    x: xBase * canvas.width + canvasCenterX, 
    y: yBase * canvas.width + canvasCenterY 
  };
};

export const calcPieceCoordinate = (canvas: HTMLCanvasElement, pieceWidth: number, piece: Piece, liftOffset: number = 0) => {
  const dh0 = 0.12; // コマの底面の中心に補正する項
  const dh = 0.19; // コマの高さ

  const { x: xBase, y: yBase } = calcPosCenter(canvas, piece.posIndex);
  const liftYOffset = liftOffset * pieceWidth;
  return { 
    x: xBase, 
    y: yBase - (dh0 + dh * piece.heightIndex) * pieceWidth - liftYOffset 
  };
};

export const calcPosRect = (canvas: HTMLCanvasElement, pieceWidth: number, posIndex: number) => {
  const rectWidth = pieceWidth;
  const rectTopHeight = pieceWidth * 0.97;
  const rectBottomHeight = pieceWidth * 0.42;
  const rectHeight = rectTopHeight + rectBottomHeight;
  const { x: xBase, y: yBase } = calcPosCenter(canvas, posIndex);

  return {
    x: xBase - rectWidth / 2,
    y: yBase - rectTopHeight,
    width: rectWidth,
    height: rectHeight,
  }
}; 