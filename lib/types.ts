export interface Player {
  name: string;
  predictions: Record<string, string>;
  lockedIn: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  results: Record<string, string>;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  nominees: string[];
}

export type Screen = 'join' | 'predict' | 'waiting' | 'live';
