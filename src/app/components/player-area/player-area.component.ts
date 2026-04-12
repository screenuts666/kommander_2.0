import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player, MTG_COLORS } from '../../models/game.model';
import { GameService } from '../../services/game.service';
import {
  IonIcon,
  IonToggle,
  IonModal,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldHalfOutline,
  chevronDownOutline,
  heart,
  settingsOutline,
  skullOutline,
  starOutline,
  flashOutline,
  closeOutline,
  checkmarkCircle,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-player-area',
  templateUrl: './player-area.component.html',
  styleUrls: ['./player-area.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonToggle,
    IonModal,
    IonInput,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
  ],
})
export class PlayerAreaComponent {
  @Input({ required: true }) player!: Player;
  @Input() extraClass: string = '';

  public gameService = inject(GameService);

  constructor() {
    addIcons({
      shieldHalfOutline,
      chevronDownOutline,
      heart,
      settingsOutline,
      skullOutline,
      closeOutline,
      starOutline,
      flashOutline,
      checkmarkCircle,
    });
  }

  // Computed states for the template
  public isPartnerMode = computed(() => {
    const p = this.gameService.players().find((x) => x.id === this.player.id);
    return p ? !!p.hasPartner : false;
  });

  public isDamageMode = computed(
    () => this.gameService.commanderDamageTarget() !== null,
  );

  public isTarget = computed(() => {
    const targetId = this.gameService.commanderDamageTarget();
    return targetId !== null && this.player && targetId === this.player.id;
  });

  public isSource = computed(() => {
    return this.isDamageMode() && !this.isTarget();
  });

  public mainCommanderDamage = computed(() => {
    if (!this.isSource()) return 0;
    const targetId = this.gameService.commanderDamageTarget();
    if (targetId === null) return 0;
    const targetPlayer = this.gameService
      .players()
      .find((p) => p.id === targetId);
    return targetPlayer?.commanderDamage?.[this.player.id] || 0;
  });

  public partnerCommanderDamage = computed(() => {
    if (!this.isSource()) return 0;
    const targetId = this.gameService.commanderDamageTarget();
    if (targetId === null) return 0;
    const targetPlayer = this.gameService
      .players()
      .find((p) => p.id === targetId);
    return targetPlayer?.partnerDamage?.[this.player.id] || 0;
  });

  // Livello 2: Poison Mode
  public isPoisonModeActive = computed(
    () => this.gameService.poisonTargetMode() !== null,
  );
  public isPoisonTarget = computed(
    () =>
      this.isPoisonModeActive() &&
      this.gameService.poisonTargetMode() === this.player.id,
  );
  public isPoisonSource = computed(
    () => this.isPoisonModeActive() && !this.isPoisonTarget(),
  ); // When one is editing poison, others darken

  // Livello 2: Status
  public isMonarch = computed(
    () => this.gameService.monarchPlayerId() === this.player.id,
  );
  public hasInitiative = computed(
    () => this.gameService.initiativePlayerId() === this.player.id,
  );
  public isMonarchInPlay = computed(
    () => this.gameService.monarchPlayerId() !== null,
  );
  public isInitiativeInPlay = computed(
    () => this.gameService.initiativePlayerId() !== null,
  );

  // Livello 2: Settings local state
  public isSettingsOpen = signal(false);
  public tempName = signal('');
  public tempColor = signal('');

  // Livello 3: UX Feedbacks and Gestures
  public recentDelta = signal(0);
  private deltaTimer: any;
  private holdTimer: any;
  private isHolding = false;

  get MTG_COLORS() {
    return MTG_COLORS;
  }

  async increment() {
    if (this.player && !this.isDamageMode() && !this.isPoisonModeActive()) {
      await Haptics.impact({ style: ImpactStyle.Light });
      this.gameService.updatePlayerLife(this.player.id, 1);
      this.trackDelta(1);
    }
  }

  async decrement() {
    if (this.player && !this.isDamageMode() && !this.isPoisonModeActive()) {
      await Haptics.impact({ style: ImpactStyle.Light });
      this.gameService.updatePlayerLife(this.player.id, -1);
      this.trackDelta(-1);
    }
  }

  private trackDelta(delta: number) {
    this.recentDelta.update((v) => v + delta);
    if (this.deltaTimer) clearTimeout(this.deltaTimer);
    this.deltaTimer = setTimeout(() => this.recentDelta.set(0), 1500);
  }

  // Long press logic
  public startHold(delta: number) {
    this.isHolding = false;
    this.holdTimer = setTimeout(async () => {
      this.isHolding = true;
      const bigDelta = delta * 10;
      this.gameService.updatePlayerLife(this.player.id, bigDelta);
      this.trackDelta(bigDelta);
      await Haptics.impact({ style: ImpactStyle.Medium });
    }, 800);
  }

  public endHold() {
    if (this.holdTimer) clearTimeout(this.holdTimer);
  }

  public handleTap(delta: number, event: Event) {
    // If it was a long press, we don't trigger the single tap
    if (this.isHolding) {
      this.isHolding = false;
      return;
    }
    if (delta > 0) this.increment();
    else this.decrement();
  }

  // Tax Logic
  updateTax(delta: number, event: Event) {
    event.stopPropagation();
    this.gameService.updateCommanderTax(this.player.id, delta);
  }

  enterCommanderDamageMode(event: Event) {
    event.stopPropagation();
    if (this.player) {
      this.gameService.setCommanderDamageTarget(this.player.id);
    }
  }

  exitCommanderDamageMode(event: Event) {
    event.stopPropagation();
    this.gameService.setCommanderDamageTarget(null);
  }

  async changeCommanderDamageDirect(
    delta: number,
    isPartner: boolean,
    event: Event,
  ) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Light });
    const targetId = this.gameService.commanderDamageTarget();
    if (targetId !== null && this.player) {
      this.gameService.updateCommanderDamage(
        targetId,
        this.player.id,
        isPartner,
        delta,
      );
    }
  }

  togglePartner(event: any) {
    this.gameService.togglePartnerMode(this.player.id, event.detail.checked);
  }

  // Poison Events
  enterPoisonMode(event: Event) {
    event.stopPropagation();
    if (this.player) {
      this.gameService.setPoisonTargetMode(this.player.id);
    }
  }

  exitPoisonMode(event: Event) {
    event.stopPropagation();
    this.gameService.setPoisonTargetMode(null);
  }

  async changePoisonDirect(delta: number, event: Event) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Light });
    this.gameService.updatePoison(this.player.id, delta);
  }

  // Settings Events
  openSettings(event: Event) {
    event.stopPropagation();
    
    // Rimuoviamo eventuale cache di "Player X" dai vecchi test
    let currentName = this.player.name;
    if (currentName?.startsWith('Player ')) {
      currentName = undefined;
    }
    
    this.tempName.set(currentName || `GIOCATORE ${this.player.id}`);
    this.tempColor.set(this.player.color);
    this.isSettingsOpen.set(true);
  }

  closeSettings() {
    this.isSettingsOpen.set(false);
  }

  saveSettings() {
    this.gameService.updatePlayerIdentity(
      this.player.id,
      this.tempName(),
      this.tempColor(),
    );
    this.isSettingsOpen.set(false);
  }

  claimMonarch() {
    this.gameService.setMonarch(this.player.id);
  }

  claimInitiative() {
    this.gameService.setInitiative(this.player.id);
  }

  claimMonarchMain(event: Event) {
    event.stopPropagation();
    this.claimMonarch();
  }

  claimInitiativeMain(event: Event) {
    event.stopPropagation();
    this.claimInitiative();
  }

  assignPoisonFromSettings(event: Event) {
    this.enterPoisonMode(event);
    this.closeSettings();
  }

  selectColor(color: string) {
    this.tempColor.set(color);
  }

  onNameChange(event: any) {
    this.tempName.set(event.detail.value);
  }
}
