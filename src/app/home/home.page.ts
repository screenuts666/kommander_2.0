import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon, AlertController, IonFooter, IonToolbar, IonSpinner } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { home, refresh } from 'ionicons/icons';
import { PlayerAreaComponent } from '../components/player-area/player-area.component';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent, PlayerAreaComponent, CommonModule, IonButton, IonIcon, IonFooter, IonToolbar, IonSpinner],
})
export class HomePage {
  public gameService = inject(GameService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  public players = this.gameService.players;
  public settings = this.gameService.settings;

  constructor() {
    addIcons({ home, refresh });
  }

  get layoutClass(): string {
    const layoutType = this.settings().layout;
    return `layout-${layoutType}`;
  }

  async goBack() {
    const alert = await this.alertCtrl.create({
      header: 'Torna al Setup',
      message: 'Sei sicuro di voler tornare indietro? I punti attuali verranno persi.',
      cssClass: 'minimal-dark-alert',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { 
          text: 'Conferma', 
          role: 'destructive', 
          handler: () => this.router.navigate(['/setup']) 
        }
      ]
    });
    await alert.present();
  }

  async reset() {
    const alert = await this.alertCtrl.create({
      header: 'Ricomincia Partita',
      message: 'Sei sicuro di voler ripristinare i punti vita iniziali?',
      cssClass: 'minimal-dark-alert',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { 
          text: 'Ricomincia', 
          role: 'destructive', 
          handler: () => this.gameService.resetGame() 
        }
      ]
    });
    await alert.present();
  }
}
