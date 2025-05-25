import React, { useRef, useEffect } from 'react';
import './Board.css';

const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // キャンバスの背景を設定
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 簡単な装飾を追加
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      }
    }
  }, []);

  return (
    <div className="board-container">
      <canvas 
        ref={canvasRef}
        className="board-canvas"
        width={300}
        height={200}
      />
    </div>
  );
};

export default Board; 