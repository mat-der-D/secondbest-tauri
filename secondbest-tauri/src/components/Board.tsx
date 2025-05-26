import React, { useRef, useEffect, useState } from 'react';
import './Board.css';

interface Piece {
  x: number;
  y: number;
}

const adjustSize = (originalWidth: number, originalHeight: number, targetWidth: number) => {
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: targetWidth,
    height: targetWidth * aspectRatio,
  };
}

const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [pieceImage, setPieceImage] = useState<HTMLImageElement | null>(null);
  const [boardImage, setBoardImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // 駒の画像を読み込む
    const pieceImg = new Image();
    pieceImg.onload = () => {
      setPieceImage(pieceImg);
    };
    pieceImg.src = '/src/assets/piece_white.svg';

    // ボードの背景画像を読み込む
    const boardImg = new Image();
    boardImg.onload = () => {
      setBoardImage(boardImg);
    };
    boardImg.src = '/src/assets/board.svg';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && pieceImage && boardImage) {
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
          const pieceWidth = 40; // 駒のサイズの幅
          
          // adjustSize関数を使って駒のサイズを調整
          const { width: drawPieceWidth, height: drawPieceHeight } = adjustSize(
            pieceImage.width,
            pieceImage.height,
            pieceWidth
          );
          
          ctx.drawImage(
            pieceImage,
            piece.x - drawPieceWidth / 2,
            piece.y - drawPieceHeight / 2,
            drawPieceWidth,
            drawPieceHeight
          );
        });
      }
    }
  }, [pieces, pieceImage, boardImage]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // 新しい駒を追加
      setPieces(prevPieces => [...prevPieces, { x, y }]);
    }
  };

  return (
    <div className="board-container">
      <canvas 
        ref={canvasRef}
        className="board-canvas"
        width={300}
        height={200}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default Board; 