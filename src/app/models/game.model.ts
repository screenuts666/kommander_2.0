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
  hasPartner?: boolean;
}

export interface GameSettings {
  startingLife: StartingLife;
  numPlayers: NumPlayers;
  layout: LayoutType;
}

export const MTG_COLORS = [
  'linear-gradient(135deg, #64748B 0%, #1E293B 100%)', // White (Slate Pearl - Dark enough for white text)
  'linear-gradient(135deg, #0284C7 0%, #082F49 100%)', // Blue (Deep Ocean)
  'linear-gradient(135deg, #3F3F46 0%, #09090B 100%)', // Black (Abyssal Void)
  'linear-gradient(135deg, #DC2626 0%, #450A0A 100%)', // Red (Crimson Blood)
  'linear-gradient(135deg, #059669 0%, #022C22 100%)', // Green (Emerald Forest)
  'linear-gradient(135deg, #B45309 0%, #451A03 100%)', // Colorless (Artifact Bronze)
];
