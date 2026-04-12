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
  'linear-gradient(135deg, #7C7360 0%, #302C23 100%)', // White (Dark Golden Pearl)
  'linear-gradient(135deg, #214F75 0%, #0C1E2E 100%)', // Blue (Deep Sea)
  'linear-gradient(135deg, #2A2130 0%, #0D0A0F 100%)', // Black (Dark Violet/Charcoal)
  'linear-gradient(135deg, #7A2424 0%, #2B0A0A 100%)', // Red (Dark Blood)
  'linear-gradient(135deg, #285934 0%, #0F2414 100%)', // Green (Deep Jungle)
  'linear-gradient(135deg, #694C2B 0%, #26190B 100%)', // Colorless (Dark Amber)
];
