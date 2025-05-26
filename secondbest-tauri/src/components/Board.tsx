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

  useEffect(() => {
    // SVG画像を読み込む
    const img = new Image();
    img.onload = () => {
      setPieceImage(img);
    };
    // SVGをData URLに変換して読み込む
    img.src = '/src/assets/piece_white.svg';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && pieceImage) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // キャンバスを白い背景でクリア
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
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
  }, [pieces, pieceImage]);

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