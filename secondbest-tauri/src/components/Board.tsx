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

const calcPieceCoordinate = (canvas: HTMLCanvasElement, pieceWidth: number, piece: Piece) => {
  const dh0 = 0.12; // コマの底面の中心に補正する項
  const dh = 0.19; // コマの高さ

  const radiusX = 0.358;
  const radiusY = radiusX * 0.8;
  const angle = (-3 * Math.PI / 8) + (Math.PI / 4) * piece.posIndex;
  const [xBase, yBase] = [ radiusX * Math.cos(angle), radiusY * Math.sin(angle) ];

  const relativeX = xBase * canvas.width;
  const relativeY = yBase * canvas.width - (dh0 + dh * piece.heightIndex) * pieceWidth;

  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  return { x: relativeX + canvasCenterX, y: relativeY + canvasCenterY };
};

const Board: React.FC = () => {
  const canvasWidth = 350;
  const canvasHeight = 350;
  const pieceWidth = 50;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [clickCount, setClickCount] = useState<number>(0);
  const [pieceImageWhite, setPieceImageWhite] = useState<HTMLImageElement | null>(null);
  const [pieceImageBlack, setPieceImageBlack] = useState<HTMLImageElement | null>(null);
  const [boardImage, setBoardImage] = useState<HTMLImageElement | null>(null);

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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && pieceImageWhite && pieceImageBlack && boardImage) {
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
        
        // 配置された駒を描画
        pieces.forEach(piece => {
          // 駒の座標を計算
          const { x, y } = calcPieceCoordinate(canvas, pieceWidth, piece);
          
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
      }
    }
  }, [pieces, pieceImageWhite, pieceImageBlack, boardImage]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      // 駒の配置を計算
      const posIndex = clickCount % 8;
      const heightIndex = Math.floor(clickCount / 8);
      
      // クリック回数の偶奇に応じて色を決定（偶数: 白、奇数: 黒）
      const color: 'B' | 'W' = clickCount % 2 === 0 ? 'W' : 'B';

      // 新しい駒を追加
      setPieces(prevPieces => [...prevPieces, { posIndex, heightIndex, color }]);
      setClickCount(prevClick => prevClick + 1);
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