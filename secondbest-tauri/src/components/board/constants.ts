import { Player, Position } from '../../types/game';

// 定数定義
export const BOARD_CONSTANTS = {
  CANVAS_WIDTH: 350,
  CANVAS_HEIGHT: 350,
  PIECE_WIDTH: 50,
  CELL_WIDTH: 70,
  PIECE_LIFT_OFFSET_RATIO: 0.2,
} as const;

export const IMAGE_PATHS = {
  pieceWhite: '/src/assets/piece_white.svg',
  pieceBlack: '/src/assets/piece_black.svg',
  board: '/src/assets/board.svg',
  pieceFrame: '/src/assets/piece_frame.svg',
  cellFrame: '/src/assets/cell_frame.svg',
  secondBest: '/src/assets/secondbest.svg',
} as const;

// 型定義
export interface Piece {
  posIndex: number;
  heightIndex: number;
  color: 'B' | 'W';
}

export interface Images {
  pieceWhite: HTMLImageElement | null;
  pieceBlack: HTMLImageElement | null;
  board: HTMLImageElement | null;
  pieceFrame: HTMLImageElement | null;
  cellFrame: HTMLImageElement | null;
  secondBest: HTMLImageElement | null;
}

// Position列挙型とposIndexの変換関数
export const positionToIndex = (position: Position): number => {
  const positionMap: Record<Position, number> = {
    [Position.N]: 0, [Position.NE]: 1, [Position.E]: 2, [Position.SE]: 3,
    [Position.S]: 4, [Position.SW]: 5, [Position.W]: 6, [Position.NW]: 7
  };
  return positionMap[position];
};

export const indexToPosition = (index: number): Position => {
  const indexMap: Position[] = [Position.N, Position.NE, Position.E, Position.SE, Position.S, Position.SW, Position.W, Position.NW];
  return indexMap[index];
};

// Player型とcolor文字の変換関数
export const playerToColor = (player: Player): 'B' | 'W' => {
  return player === Player.Black ? 'B' : 'W';
};

export const colorToPlayer = (color: 'B' | 'W'): Player => {
  return color === 'B' ? Player.Black : Player.White;
}; 