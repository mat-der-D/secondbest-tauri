import React, { useRef, useEffect, useState } from 'react';
import './Board.css';

// 定数定義
const BOARD_CONSTANTS = {
  CANVAS_WIDTH: 350,
  CANVAS_HEIGHT: 350,
  PIECE_WIDTH: 50,
  CELL_WIDTH: 70,
  PIECE_LIFT_OFFSET_RATIO: 0.2,
} as const;

const IMAGE_PATHS = {
  pieceWhite: '/src/assets/piece_white.svg',
  pieceBlack: '/src/assets/piece_black.svg',
  board: '/src/assets/board.svg',
  pieceFrame: '/src/assets/piece_frame.svg',
  cellFrame: '/src/assets/cell_frame.svg',
  secondBest: '/src/assets/secondbest.svg',
} as const;

// 型定義
interface Piece {
  posIndex: number;
  heightIndex: number;
  color: 'B' | 'W';
}

interface Images {
  pieceWhite: HTMLImageElement | null;
  pieceBlack: HTMLImageElement | null;
  board: HTMLImageElement | null;
  pieceFrame: HTMLImageElement | null;
  cellFrame: HTMLImageElement | null;
  secondBest: HTMLImageElement | null;
}

// ユーティリティ関数
const adjustSize = (originalWidth: number, originalHeight: number, targetWidth: number) => {
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: targetWidth,
    height: targetWidth * aspectRatio,
  };
};

const calcPosCenter = (canvas: HTMLCanvasElement, posIndex: number) => {
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

const calcPieceCoordinate = (canvas: HTMLCanvasElement, pieceWidth: number, piece: Piece, liftOffset: number = 0) => {
  const dh0 = 0.12; // コマの底面の中心に補正する項
  const dh = 0.19; // コマの高さ

  const { x: xBase, y: yBase } = calcPosCenter(canvas, piece.posIndex);
  const liftYOffset = liftOffset * pieceWidth;
  return { 
    x: xBase, 
    y: yBase - (dh0 + dh * piece.heightIndex) * pieceWidth - liftYOffset 
  };
};

const calcPosRect = (canvas: HTMLCanvasElement, pieceWidth: number, posIndex: number) => {
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

// 画像読み込み用のカスタムフック
const useImageLoader = () => {
  const [images, setImages] = useState<Images>({
    pieceWhite: null,
    pieceBlack: null,
    board: null,
    pieceFrame: null,
    cellFrame: null,
    secondBest: null,
  });

  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const loadAllImages = async () => {
      try {
        const [
          pieceWhite,
          pieceBlack,
          board,
          pieceFrame,
          cellFrame,
          secondBest
        ] = await Promise.all([
          loadImage(IMAGE_PATHS.pieceWhite),
          loadImage(IMAGE_PATHS.pieceBlack),
          loadImage(IMAGE_PATHS.board),
          loadImage(IMAGE_PATHS.pieceFrame),
          loadImage(IMAGE_PATHS.cellFrame),
          loadImage(IMAGE_PATHS.secondBest),
        ]);
        
        setImages({
          pieceWhite,
          pieceBlack,
          board,
          pieceFrame,
          cellFrame,
          secondBest,
        });
      } catch (error) {
        console.error('Failed to load images:', error);
      }
    };

    loadAllImages();
  }, []);

  return images;
};

// 描画関数群
const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, boardImage: HTMLImageElement) => {
  const { width: drawWidth, height: drawHeight } = adjustSize(
    boardImage.width,
    boardImage.height,
    canvas.width
  );
  
  const offsetX = (canvas.width - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;
  
  ctx.drawImage(boardImage, offsetX, offsetY, drawWidth, drawHeight);
};

const drawHighlightedCells = (
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

const drawPieces = (
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

const drawPieceFrames = (
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

const drawSecondBest = (
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

// メインコンポーネント
const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useImageLoader();
  
  const [pieces, setPieces] = useState<Piece[]>(() => {
    // 初期状態で各マスに3つずつコマを配置
    const initialPieces: Piece[] = [];
    for (let posIndex = 0; posIndex < 8; posIndex++) {
      // 偶数のマスには白黒白、奇数のマスには黒白黒を配置
      const colors: ('B' | 'W')[] = posIndex % 2 === 0 ? ['W', 'B', 'W'] : ['B', 'W', 'B'];
      for (let heightIndex = 0; heightIndex < 3; heightIndex++) {
        initialPieces.push({
          posIndex,
          heightIndex,
          color: colors[heightIndex]
        });
      }
    }
    return initialPieces;
  });
  
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [highlightedPieces, setHighlightedPieces] = useState<number[]>([]);
  const [liftedPieces, setLiftedPieces] = useState<number[]>([]);
  const [clickCount, setClickCount] = useState<number>(0);
  const [showSecondBest, setShowSecondBest] = useState<boolean>(false);

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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
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
      
      // secondbest.svgの表示・非表示を切り替える
      setShowSecondBest(prevShow => !prevShow);
      
      // マスのリフト状態を切り替える
      setLiftedPieces(prevLiftedPieces => {
        if (prevLiftedPieces.includes(clickedPosIndex)) {
          // すでに含まれている場合は削除
          return prevLiftedPieces.filter(index => index !== clickedPosIndex);
        } else {
          // 含まれていない場合は追加
          return [...prevLiftedPieces, clickedPosIndex];
        }
      });
    }
  };

  return (
    <div className="board-container">
      <canvas 
        ref={canvasRef}
        className="board-canvas"
        width={BOARD_CONSTANTS.CANVAS_WIDTH}
        height={BOARD_CONSTANTS.CANVAS_HEIGHT}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default Board; 