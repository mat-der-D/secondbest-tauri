import React, { useRef, useEffect, useState } from 'react';
import './Board.css';

interface Piece {
  posIndex: number;
  heightIndex: number;
  color: 'B' | 'W';
}

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
  const [xBase, yBase] = [ radiusX * Math.cos(angle), radiusY * Math.sin(angle) ];
  
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
  // liftOffsetを適用（pieceWidthに対する倍率）
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


const Board: React.FC = () => {
  const canvasWidth = 350;
  const canvasHeight = 350;
  const pieceWidth = 50;
  const cellWidth = 70; // マスの幅を定義
  const pieceLifeOffsetRatio = 0.3; // コマを持ち上げる高さ（pieceWidthに対する倍率）
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]); // 赤いマスを表示する位置
  const [highlightedPieces, setHighlightedPieces] = useState<number[]>([]); // ハイライトするコマの位置
  const [liftedPieces, setLiftedPieces] = useState<number[]>([]); // 持ち上げるコマの位置のposIndex
  const [clickCount, setClickCount] = useState<number>(0);
  const [pieceImageWhite, setPieceImageWhite] = useState<HTMLImageElement | null>(null);
  const [pieceImageBlack, setPieceImageBlack] = useState<HTMLImageElement | null>(null);
  const [boardImage, setBoardImage] = useState<HTMLImageElement | null>(null);
  const [pieceFrameImage, setPieceFrameImage] = useState<HTMLImageElement | null>(null);
  const [cellFrameImage, setCellFrameImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // 白コマの画像を読み込む
    const pieceImgWhite = new Image();
    pieceImgWhite.onload = () => {
      setPieceImageWhite(pieceImgWhite);
    };
    pieceImgWhite.src = '/src/assets/piece_white.svg';

    // 黒コマの画像を読み込む
    const pieceImgBlack = new Image();
    pieceImgBlack.onload = () => {
      setPieceImageBlack(pieceImgBlack);
    };
    pieceImgBlack.src = '/src/assets/piece_black.svg';

    // ボードの背景画像を読み込む
    const boardImg = new Image();
    boardImg.onload = () => {
      setBoardImage(boardImg);
    };
    boardImg.src = '/src/assets/board.svg';
    
    // コマのフレーム画像を読み込む
    const pieceFrameImg = new Image();
    pieceFrameImg.onload = () => {
      setPieceFrameImage(pieceFrameImg);
    };
    pieceFrameImg.src = '/src/assets/piece_frame.svg';
    
    // セルのフレーム画像を読み込む
    const cellFrameImg = new Image();
    cellFrameImg.onload = () => {
      setCellFrameImage(cellFrameImg);
    };
    cellFrameImg.src = '/src/assets/cell_frame.svg';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && pieceImageWhite && pieceImageBlack && boardImage && cellFrameImage && pieceFrameImage) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // ボードの背景画像を縦横比を保持して描画
        const { width: drawWidth, height: drawHeight } = adjustSize(
          boardImage.width,
          boardImage.height,
          canvas.width
        );
        
        // キャンバスの中央に配置するためのオフセットを計算
        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;
        
        ctx.drawImage(boardImage, offsetX, offsetY, drawWidth, drawHeight);

        // ハイライトされたセルを描画
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

        // 各posIndexごとに最も高いheightIndexを持つコマの位置を計算
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
          // 最上部のコマかどうかを判断
          const isTopPiece = piece.heightIndex === posMaxHeightMap.get(piece.posIndex);
          // 持ち上げるべきコマかどうかを判断し、必要ならオフセットを適用
          const liftOffset = isTopPiece && liftedPieces.includes(piece.posIndex) ? pieceLifeOffsetRatio : 0;
          
          // 駒の座標を計算
          const { x, y } = calcPieceCoordinate(canvas, pieceWidth, piece, liftOffset);
          
          // 色に応じて適切な画像を選択
          const pieceImage = piece.color === 'W' ? pieceImageWhite : pieceImageBlack;
          
          // adjustSize関数を使って駒のサイズを調整
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
        });
        
        // ハイライトされたposIndexの位置だけフレームを描画
        highlightedPieces.forEach(posIndex => {
          const maxHeight = posMaxHeightMap.get(posIndex);
          // その位置にコマがある場合のみフレームを描画
          if (maxHeight !== undefined) {
            const topPiece: Piece = { posIndex, heightIndex: maxHeight, color: 'W' }; // 色は描画に影響しないのでどちらでも良い
            // 持ち上げるべきコマかどうかを判断し、必要ならオフセットを適用
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
      }
    }
  }, [pieces, pieceImageWhite, pieceImageBlack, boardImage, cellFrameImage, pieceFrameImage, highlightedCells, highlightedPieces, liftedPieces]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      // キャンバス上のクリック座標を取得
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // どのposIndexの領域内がクリックされたかを判定
      const clickedPosIndex = Array.from({ length: 8 }).findIndex((_, posIndex) => {
        const { x, y, width, height } = calcPosRect(canvas, pieceWidth, posIndex);
        return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height;
      });

      // クリックされた位置が領域内にない場合は何もしない
      if (clickedPosIndex === -1) return;
      
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
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default Board; 