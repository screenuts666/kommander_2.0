import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../models/game.model';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-player-area',
  templateUrl: './player-area.component.html',
  styleUrls: ['./player-area.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class PlayerAreaComponent {
  // Pass the entire player model object
  @Input({ required: true }) player!: Player;
  
  // Custom class for specific rotations if needed (like 'rotate-90' or 'rotate-270')
  @Input() extraClass: string = '';

  private gameService = inject(GameService);

  increment() {
    if (this.player) {
      this.gameService.updatePlayerLife(this.player.id, 1);
    }
  }

  decrement() {
    if (this.player) {
      this.gameService.updatePlayerLife(this.player.id, -1);
    }
  }
}
