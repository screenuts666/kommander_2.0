import { Injectable, signal, effect } from '@angular/core';
import {
  GameSettings,
  Player,
  MTG_COLORS,
  LayoutType,
} from '../models/game.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  public settings = signal<GameSettings>({
    startingLife: 40,
    numPlayers: 4,
    layout: '2v2-opposite',
  });

  public players = signal<Player[]>([]);
  public commanderDamageTarget = signal<number | null>(null);
  public gameLogs = signal<any[]>([]);

  // STATI LIVELLO 2
  public monarchPlayerId = signal<number | null>(null);
  public initiativePlayerId = signal<number | null>(null);
  public poisonTargetMode = signal<number | null>(null);

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
      const mon = this.monarchPlayerId();
      const ini = this.initiativePlayerId();

      // Salva solo dopo che il caricamento differito è terminato
      if (ready) {
        const payload = {
          settings: s,
          players: p,
          commanderDamageTarget: c,
          monarchPlayerId: mon,
          initiativePlayerId: ini,
          gameLogs: this.gameLogs(),
        };
        Preferences.set({
          key: 'mtgTrackerState',
          value: JSON.stringify(payload),
        });
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
        this.monarchPlayerId.set(
          parsed.monarchPlayerId !== undefined ? parsed.monarchPlayerId : null,
        );
        this.initiativePlayerId.set(
          parsed.initiativePlayerId !== undefined
            ? parsed.initiativePlayerId
            : null,
        );
        this.gameLogs.set(parsed.gameLogs || []);
      } catch (e) {
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
    this.commanderDamageTarget.set(null);
    this.poisonTargetMode.set(null);
    this.monarchPlayerId.set(null);
    this.initiativePlayerId.set(null);
    this.initPlayers(newSettings);
  }

  public resetGame() {
    this.commanderDamageTarget.set(null);
    this.poisonTargetMode.set(null);
    this.monarchPlayerId.set(null);
    this.initiativePlayerId.set(null);
    this.gameLogs.set([]);
    const oldPlayers = this.players();
    this.initPlayers(this.settings(), oldPlayers);
  }

  public setCommanderDamageTarget(playerId: number | null) {
    if (playerId !== null) this.poisonTargetMode.set(null); // Mutua esclusione
    this.commanderDamageTarget.set(playerId);
  }

  public setPoisonTargetMode(playerId: number | null) {
    if (playerId !== null) this.commanderDamageTarget.set(null); // Mutua esclusione
    this.poisonTargetMode.set(playerId);
  }

  public setMonarch(playerId: number | null) {
    // Esclusività gestita da signal set
    this.monarchPlayerId.set(playerId);
  }

  public setInitiative(playerId: number | null) {
    this.initiativePlayerId.set(playerId);
  }

  public logAction(message: string) {
    const logs = [...this.gameLogs()];
    // Manteniamo solo le ultime 30 azioni per leggerezza
    if (logs.length > 30) logs.pop();
    logs.unshift({ timestamp: Date.now(), message });
    this.gameLogs.set(logs);
  }

  public updatePlayerLife(playerId: number, delta: number) {
    this.players.update((players) =>
      players.map((p) => {
        if (p.id === playerId) {
          const newLife = p.life + delta;
          const playerName = p.name || `Giocatore ${p.id}`;
          this.logAction(
            `${playerName}: ${delta > 0 ? '+' : ''}${delta} Vita (${newLife})`,
          );
          return { ...p, life: newLife };
        }
        return p;
      }),
    );
  }

  public updateCommanderTax(playerId: number, delta: number) {
    this.players.update((players) =>
      players.map((p) =>
        p.id === playerId
          ? { ...p, commanderTax: Math.max(0, p.commanderTax + delta) }
          : p,
      ),
    );
  }

  public updatePoison(playerId: number, delta: number) {
    this.players.update((players) =>
      players.map((p) => {
        if (p.id === playerId) {
          const newPoison = Math.max(0, p.poison + delta);
          const playerName = p.name || `Giocatore ${p.id}`;
          this.logAction(
            `${playerName}: ${delta > 0 ? '+' : ''}${delta} Veleno (${newPoison})`,
          );
          return { ...p, poison: newPoison };
        }
        return p;
      }),
    );
  }

  public updateCommanderDamage(
    targetId: number,
    sourceId: number,
    isPartner: boolean,
    delta: number,
  ) {
    this.players.update((players) => {
      return players.map((p) => {
        if (p.id === targetId) {
          const dict = isPartner ? p.partnerDamage : p.commanderDamage;
          const currentDmg = dict[sourceId] || 0;
          const newDmg = Math.max(0, currentDmg + delta); // non può scendere sotto zero
          const actualDelta = newDmg - currentDmg; // quanti danni EFFETTIVAMENTE aggiunti o rimossi

          return {
            ...p,
            life: p.life - actualDelta, // sottrae dalla vita i danni aggiunti (o somma se rimossi)
            commanderDamage: isPartner
              ? p.commanderDamage
              : { ...p.commanderDamage, [sourceId]: newDmg },
            partnerDamage: isPartner
              ? { ...p.partnerDamage, [sourceId]: newDmg }
              : p.partnerDamage,
          };
        }
        return p;
      });
    });
  }

  public updatePlayerIdentity(playerId: number, name: string, color: string) {
    this.players.update((players) =>
      players.map((p) => (p.id === playerId ? { ...p, name, color } : p)),
    );
  }

  private initPlayers(settings: GameSettings, oldPlayers?: Player[]) {
    const newPlayers: Player[] = [];

    for (let i = 0; i < settings.numPlayers; i++) {
      let isFlipped = false;
      let cssClass = '';

      switch (settings.layout) {
        case '1v1-opposite':
          isFlipped = i === 0;
          break;
        case '2v2-opposite':
          if (i === 0 || i === 2) {
            cssClass = 'rotate-90';
          } else {
            cssClass = 'rotate-270';
          }
          break;
        case '3v3-opposite':
          if (i === 0 || i === 2 || i === 4) {
            cssClass = 'rotate-90';
          } else {
            cssClass = 'rotate-270';
          }
          break;
        case '1v1-side-by-side':
          if (i === 0 || i === 1) {
            cssClass = 'rotate-90';
          }
          break;
        case 'single':
          isFlipped = false;
          break;
        case '5-around':
          if (i === 0) {
            isFlipped = true;
          } else if (i === 1 || i === 3) {
            cssClass = 'rotate-90';
          } else if (i === 2 || i === 4) {
            cssClass = 'rotate-270';
          }
          break;
        case '3-around':
          if (i === 0) {
            isFlipped = true;
          } else if (i === 1) {
            cssClass = 'rotate-90';
          } else if (i === 2) {
            cssClass = 'rotate-270';
          }
          break;
        case '4-around':
          if (i === 0) {
            isFlipped = true;
          } else if (i === 1) {
            cssClass = 'rotate-90';
          } else if (i === 2) {
            isFlipped = false;
          } else if (i === 3) {
            cssClass = 'rotate-270';
          }
          break;
        case '6-around':
          if (i === 0) {
            isFlipped = true;
          } else if (i === 1 || i === 3) {
            cssClass = 'rotate-90';
          } else if (i === 2 || i === 4) {
            cssClass = 'rotate-270';
          } else if (i === 5) {
            isFlipped = false;
          }
          break;
      }

      // Se facciamo un reset, vogliamo ereditare nome e colore se l'ID esiste
      const existingIdentity = oldPlayers?.find((op) => op.id === i + 1);
      const color = existingIdentity
        ? existingIdentity.color
        : MTG_COLORS[i % MTG_COLORS.length];
      const name = existingIdentity ? existingIdentity.name : undefined;
      const hasPartner = existingIdentity ? existingIdentity.hasPartner : false;

      newPlayers.push({
        id: i + 1,
        life: settings.startingLife,
        name: name,
        color: color,
        isFlipped: isFlipped,
        cssClass: cssClass,
        commanderDamage: {},
        partnerDamage: {},
        hasPartner: hasPartner,
        poison: 0,
        commanderTax: 0,
      });
    }

    this.players.set(newPlayers);
  }

  public togglePartnerMode(playerId: number, isEnabled: boolean) {
    this.players.update((players) =>
      players.map((p) =>
        p.id === playerId ? { ...p, hasPartner: isEnabled } : p,
      ),
    );
  }
}
