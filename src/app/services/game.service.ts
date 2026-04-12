import { Injectable, signal, computed } from '@angular/core';
import { GameSettings, Player, MTG_COLORS, LayoutType } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  
  public settings = signal<GameSettings>({
    startingLife: 40,
    numPlayers: 4,
    layout: '2v2-opposite'
  });

  public players = signal<Player[]>([]);

  constructor() {
    this.initPlayers(this.settings());
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings.set(newSettings);
    this.initPlayers(newSettings);
  }

  public resetGame() {
    this.initPlayers(this.settings());
  }

  public updatePlayerLife(playerId: number, delta: number) {
    this.players.update(players => 
      players.map(p => p.id === playerId ? { ...p, life: p.life + delta } : p)
    );
  }

  private initPlayers(settings: GameSettings) {
    const newPlayers: Player[] = [];
    
    for (let i = 0; i < settings.numPlayers; i++) {
      let isFlipped = false;
      let cssClass = '';
      
      switch (settings.layout) {
        case '1v1-opposite':
          isFlipped = i === 0;
          break;
        case '2v2-opposite':
          // P1(0), P3(2) a sinistra -> facciata verso sinistra (rotate-90)
          // P2(1), P4(3) a destra -> facciata verso destra (rotate-270)
          if (i === 0 || i === 2) { cssClass = 'rotate-90'; }
          else { cssClass = 'rotate-270'; }
          break;
        case '3v3-opposite':
          // 3 per lato, schermo orizzontale
          // P1, P3, P5 a sinistra (rotate-90)
          // P2, P4, P6 a destra (rotate-270)
          if (i === 0 || i === 2 || i === 4) { cssClass = 'rotate-90'; }
          else { cssClass = 'rotate-270'; }
          break;
        case '1v1-side-by-side':
          // Entrambi rivolti verso sx (rotate-90)
          if (i === 0 || i === 1) { cssClass = 'rotate-90'; }
          break;
        case 'single':
          isFlipped = false;
          break;
        case '5-around':
          // P1(0) in alto al contrario (flipped: true)
          // P2(1), P4(3) a sx verso sx (rotate-90)
          // P3(2), P5(4) a dx verso dx (rotate-270)
          if (i === 0) { isFlipped = true; }
          else if (i === 1 || i === 3) { cssClass = 'rotate-90'; }
          else if (i === 2 || i === 4) { cssClass = 'rotate-270'; }
          break;
        case '3-around':
          // P1(0) grande in alto -> capovolto
          // P2(1) piccolo a sx -> verso sx (rotate-90)
          // P3(2) piccolo a dx -> verso dx (rotate-270)
          if (i === 0) { isFlipped = true; }
          else if (i === 1) { cssClass = 'rotate-90'; }
          else if (i === 2) { cssClass = 'rotate-270'; }
          break;
        case '4-around':
          // P1(0) in alto al contrario (flipped: true)
          // P2(1) a sx verso sx (rotate-90)
          // P3(2) rimane uguale (flipped: false) in basso
          // P4(3) a dx verso dx (rotate-270)
          if (i === 0) { isFlipped = true; }
          else if (i === 1) { cssClass = 'rotate-90'; }
          else if (i === 2) { isFlipped = false; }
          else if (i === 3) { cssClass = 'rotate-270'; }
          break;
        case '6-around':
          // P1(0) = Top (Flipped)
          // P2(1), P4(3) = Left (Rotated 90)
          // P3(2), P5(4) = Right (Rotated 270)
          // P6(5) = Bottom (Normal)
          if (i === 0) { isFlipped = true; } 
          else if (i === 1 || i === 3) { cssClass = 'rotate-90'; } 
          else if (i === 2 || i === 4) { cssClass = 'rotate-270'; } 
          else if (i === 5) { isFlipped = false; } 
          break;
      }

      const color = MTG_COLORS[i % MTG_COLORS.length];

      newPlayers.push({
        id: i + 1,
        life: settings.startingLife,
        color: color,
        isFlipped: isFlipped,
        cssClass: cssClass
      });
    }

    this.players.set(newPlayers);
  }
}
