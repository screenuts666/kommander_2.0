import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heartOutline, peopleOutline, gridOutline } from 'ionicons/icons';
import { GameService } from '../services/game.service';
import {
  StartingLife,
  NumPlayers,
  LayoutType,
  GameSettings,
} from '../models/game.model';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.page.html',
  styleUrls: ['./setup.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    IonList,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
  ],
})
export class SetupPage {
  public startingLife: StartingLife;
  public numPlayers: NumPlayers;
  public layout: LayoutType;

  private gameService = inject(GameService);
  private router = inject(Router);

  constructor() {
    addIcons({ heartOutline, peopleOutline, gridOutline });
    const currentSettings = this.gameService.settings();
    this.startingLife = currentSettings.startingLife;
    this.numPlayers = currentSettings.numPlayers;
    this.layout = currentSettings.layout;
  }

  // Dynamic layout options based on players
  get layoutOptions(): { value: LayoutType; label: string }[] {
    switch (this.numPlayers) {
      case 1:
        return [{ value: 'single', label: 'Single Player (Test Mode)' }];
      case 2:
        return [
          { value: '1v1-opposite', label: 'Di fronte (1v1)' },
          { value: '1v1-side-by-side', label: 'Affiancati (Co-op)' },
        ];
      case 3:
        return [{ value: '3-around', label: 'Tavola Rotonda (3)' }];
      case 4:
        return [
          { value: '2v2-opposite', label: 'Due per lato (2v2)' },
          { value: '4-around', label: 'Ai quattro lati' },
        ];
      case 5:
        return [{ value: '5-around', label: 'Pentagono (5)' }];
      case 6:
        return [
          { value: '3v3-opposite', label: 'Tre per lato (3v3)' },
          { value: '6-around', label: 'Tavolone (2 Capotavola, 4 Lati)' },
        ];
      default:
        return [{ value: '2v2-opposite', label: 'Standard' }];
    }
  }

  onPlayersChange() {
    // Automatically select the first available layout when player count changes
    this.layout = this.layoutOptions[0].value;
  }

  startGame() {
    const settings: GameSettings = {
      startingLife: this.startingLife,
      numPlayers: this.numPlayers,
      layout: this.layout,
    };
    this.gameService.updateSettings(settings);
    this.router.navigate(['/home']); // Navigate to game tracker
  }
}
