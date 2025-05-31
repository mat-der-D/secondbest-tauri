import { useState, useEffect } from 'react';
import { Images, IMAGE_PATHS } from '../constants';

// 画像読み込み用のカスタムフック
export const useImageLoader = () => {
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