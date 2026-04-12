export type StartingLife = 20 | 40;
export type NumPlayers = 1 | 2 | 3 | 4 | 5 | 6;

// Layout possibilities based on player count
export type LayoutType = 
  | 'single' 
  | '1v1-opposite' // 2 players facing each other
  | '1v1-side-by-side' // 2 players next to each other
  | '3-around' // 3 players
  | '2v2-opposite' // 4 players, 2 on each side
  | '4-around' // 4 players, 1 on each side
  | '5-around' // 5 players
  | '3v3-opposite' // 6 players, 3 on each side
  | '6-around'; // 6 players, 2 heads, 4 sides

export interface Player {
  id: number;
  life: number;
  color: string;
  isFlipped: boolean;
  cssClass?: string;
  name?: string;
  commanderDamage: Record<number, number>; // maps opponentId -> damage dealt by their main commander
  partnerDamage: Record<number, number>;   // maps opponentId -> damage dealt by their partner
}

export interface GameSettings {
  startingLife: StartingLife;
  numPlayers: NumPlayers;
  layout: LayoutType;
}

export const MTG_COLORS = [
  '#F4F1ED', // White (Off-white/Cream)
  '#4A708B', // Blue (Muted Slate)
  '#363636', // Black (Dark Charcoal)
  '#B24A4A', // Red (Muted Crimson)
  '#557A55', // Green (Muted Forest)
  '#999285', // Colorless (Warm Grey)
];
