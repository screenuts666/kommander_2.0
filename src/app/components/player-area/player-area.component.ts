import {
  Component,
  Input,
  inject,
  computed,
  signal,
  OnDestroy,
} from '@angular/core';
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
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCrown,
  faShield,
  faSkull,
  faCog,
  faHeart,
  faChevronDown,
  faCheck,
  faXmark,
  faBoltLightning,
} from '@fortawesome/free-solid-svg-icons';

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
    FontAwesomeModule,
  ],
})
export class PlayerAreaComponent implements OnDestroy {
  @Input({ required: true }) player!: Player;
  @Input() extraClass: string = '';

  public gameService = inject(GameService);

  public faCrown = faCrown;
  public faShield = faShield;
  public faSkull = faSkull;
  public faCog = faCog;
  public faBoltLightning = faBoltLightning;
  public faHeart = faHeart;
  public faChevronDown = faChevronDown;
  public faCheck = faCheck;
  public faXmark = faXmark;

  ngOnDestroy() {
    this.isSettingsOpen.set(false);
    this.endHold(); // Pulisce i timer in caso di distruzione
  }

  // Computed states
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

  public isSource = computed(() => this.isDamageMode() && !this.isTarget());

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
  );

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

  public isSettingsOpen = signal(false);
  public tempName = signal('');
  public tempColor = signal('');

  // UX Feedback states
  public recentDelta = signal(0);
  public deltaVisible = signal(false); // Aggiunto per forzare l'animazione ad ogni click
  private deltaTimer: any;

  private holdTimer: any;
  private holdInterval: any; // Aggiunto per continuare l'incremento tenendo premuto
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

    // Forza il ricaricamento del div in HTML per riavviare l'animazione
    this.deltaVisible.set(false);
    setTimeout(() => this.deltaVisible.set(true), 0);

    if (this.deltaTimer) clearTimeout(this.deltaTimer);
    this.deltaTimer = setTimeout(() => {
      this.recentDelta.set(0);
      this.deltaVisible.set(false);
    }, 1500);
  }

  // --- LOGICA LONG PRESS AGGIORNATA ---
  public startHold(delta: number) {
    this.isHolding = false;

    // Inizia la pressione lunga
    this.holdTimer = setTimeout(() => {
      this.isHolding = true;
      this.applyBigDelta(delta); // Primo scatto da 10

      // Continua ad applicare ±10 ogni mezzo secondo finché è premuto
      this.holdInterval = setInterval(() => {
        this.applyBigDelta(delta);
      }, 500);
    }, 800);
  }

  private async applyBigDelta(delta: number) {
    const bigDelta = delta * 10;
    this.gameService.updatePlayerLife(this.player.id, bigDelta);
    this.trackDelta(bigDelta);
    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  public endHold() {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    if (this.holdInterval) clearInterval(this.holdInterval);
  }

  public handleTap(delta: number, event: Event) {
    if (this.isHolding) {
      this.isHolding = false;
      return;
    }
    if (delta > 0) this.increment();
    else this.decrement();
  }
  // ------------------------------------

  updateTax(delta: number, event: Event) {
    event.stopPropagation();
    this.gameService.updateCommanderTax(this.player.id, delta);
  }

  // ... (Tutto il resto dei metodi rimane inalterato: enterCommanderDamageMode, changePoisonDirect, ecc.)

  async enterCommanderDamageMode(event: Event) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Medium });
    if (this.player) this.gameService.setCommanderDamageTarget(this.player.id);
  }

  async exitCommanderDamageMode(event: Event) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Light });
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

  async enterPoisonMode(event: Event) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Medium });
    if (this.player) this.gameService.setPoisonTargetMode(this.player.id);
  }

  async exitPoisonMode(event: Event) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Light });
    this.gameService.setPoisonTargetMode(null);
  }

  async changePoisonDirect(delta: number, event: Event) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Light });
    this.gameService.updatePoison(this.player.id, delta);
  }

  openSettings(event: Event) {
    event.stopPropagation();
    let currentName = this.player.name;
    if (currentName?.startsWith('Player ')) currentName = undefined;
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

  async claimMonarchMain(event: Event) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.claimMonarch();
  }

  async claimInitiativeMain(event: Event) {
    event.stopPropagation();
    await Haptics.impact({ style: ImpactStyle.Medium });
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
