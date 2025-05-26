import React, { useRef, useEffect, useState } from 'react';
import './Board.css';

interface Piece {
  x: number;
  y: number;
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
        
        // ボードの背景画像を描画
        ctx.drawImage(boardImage, 0, 0, canvas.width, canvas.height);
        
        // 配置された駒を描画
        pieces.forEach(piece => {
          const pieceSize = 40; // 駒のサイズ
          ctx.drawImage(
            pieceImage,
            piece.x - pieceSize / 2,
            piece.y - pieceSize / 2,
            pieceSize,
            pieceSize
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