import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../models/game.model';
import { GameService } from '../../services/game.service';
import { IonIcon, IonToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldHalfOutline, chevronDownOutline, heart } from 'ionicons/icons';

@Component({
  selector: 'app-player-area',
  templateUrl: './player-area.component.html',
  styleUrls: ['./player-area.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonToggle],
})
export class PlayerAreaComponent {
  @Input({ required: true }) player!: Player;
  @Input() extraClass: string = '';

  public gameService = inject(GameService);
  
  // Local state for source partner mode
  public isPartnerMode = signal<boolean>(false);

  constructor() {
    addIcons({ shieldHalfOutline, chevronDownOutline, heart });
  }

  // Computed states for the template
  public isDamageMode = computed(() => this.gameService.commanderDamageTarget() !== null);
  
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
    const targetPlayer = this.gameService.players().find(p => p.id === targetId);
    return targetPlayer?.commanderDamage?.[this.player.id] || 0;
  });

  public partnerCommanderDamage = computed(() => {
    if (!this.isSource()) return 0;
    const targetId = this.gameService.commanderDamageTarget();
    if (targetId === null) return 0;
    const targetPlayer = this.gameService.players().find(p => p.id === targetId);
    return targetPlayer?.partnerDamage?.[this.player.id] || 0;
  });

  increment() {
    if (this.player && !this.isDamageMode()) {
      this.gameService.updatePlayerLife(this.player.id, 1);
    }
  }

  decrement() {
    if (this.player && !this.isDamageMode()) {
      this.gameService.updatePlayerLife(this.player.id, -1);
    }
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

  changeCommanderDamageDirect(delta: number, isPartner: boolean, event: Event) {
    event.stopPropagation();
    const targetId = this.gameService.commanderDamageTarget();
    if (targetId !== null && this.player) {
      this.gameService.updateCommanderDamage(targetId, this.player.id, isPartner, delta);
    }
  }

  togglePartner(event: any) {
    this.isPartnerMode.set(event.detail.checked);
  }
}
