import { Injectable, signal, computed, effect } from '@angular/core';
import { GameSettings, Player, MTG_COLORS, LayoutType } from '../models/game.model';
import { Preferences } from '@capacitor/preferences';

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
  public commanderDamageTarget = signal<number | null>(null);
  
  // Flag per comunicare alla view quando i dati Async sono pronti per essere dipinti
  public isReady = signal<boolean>(false);

  constructor() {
    this.loadSavedState();

    effect(() => {
      // Ascoltiamo l'intero blocco di dati sensibili
      const ready = this.isReady();
      const s = this.settings();
      const p = this.players();
      const c = this.commanderDamageTarget();

      // Salva solo dopo che il caricamento differito è terminato
      if (ready) {
        const payload = { settings: s, players: p, commanderDamageTarget: c };
        Preferences.set({ key: 'mtgTrackerState', value: JSON.stringify(payload) });
      }
    });
  }

  private async loadSavedState() {
    const { value } = await Preferences.get({ key: 'mtgTrackerState' });
    
    if (value) {
      try {
        const parsed = JSON.parse(value);
        this.settings.set(parsed.settings);
        this.players.set(parsed.players);
        this.commanderDamageTarget.set(parsed.commanderDamageTarget);
      } catch(e) {
        // Fallback in caso di corruzione del JSON salvato
        this.initPlayers(this.settings());
      }
    } else {
      this.initPlayers(this.settings());
    }
    
    this.isReady.set(true);
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings.set(newSettings);
    this.commanderDamageTarget.set(null); // Fix: pulisce sempre la modalità danni
    this.initPlayers(newSettings);
  }

  public resetGame() {
    this.commanderDamageTarget.set(null);
    this.initPlayers(this.settings());
  }

  public setCommanderDamageTarget(playerId: number | null) {
    this.commanderDamageTarget.set(playerId);
  }

  public updatePlayerLife(playerId: number, delta: number) {
    this.players.update(players => 
      players.map(p => p.id === playerId ? { ...p, life: p.life + delta } : p)
    );
  }

  public updateCommanderDamage(targetId: number, sourceId: number, isPartner: boolean, delta: number) {
    this.players.update(players => {
      return players.map(p => {
        if (p.id === targetId) {
          const dict = isPartner ? p.partnerDamage : p.commanderDamage;
          const currentDmg = dict[sourceId] || 0;
          const newDmg = Math.max(0, currentDmg + delta); // non può scendere sotto zero
          const actualDelta = newDmg - currentDmg; // quanti danni EFFETTIVAMENTE aggiunti o rimossi
          
          return {
            ...p,
            life: p.life - actualDelta, // sottrae dalla vita i danni aggiunti (o somma se rimossi)
            commanderDamage: isPartner ? p.commanderDamage : { ...p.commanderDamage, [sourceId]: newDmg },
            partnerDamage: isPartner ? { ...p.partnerDamage, [sourceId]: newDmg } : p.partnerDamage
          };
        }
        return p;
      });
    });
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
        cssClass: cssClass,
        commanderDamage: {},
        partnerDamage: {},
        hasPartner: false
      });
    }

    this.players.set(newPlayers);
  }

  public togglePartnerMode(playerId: number, isEnabled: boolean) {
    this.players.update(players => 
      players.map(p => p.id === playerId ? { ...p, hasPartner: isEnabled } : p)
    );
  }
}
