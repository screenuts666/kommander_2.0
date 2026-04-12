import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { KeepAwake } from '@capgo/capacitor-keep-awake';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() {}

  async ngOnInit() {
    try {
      const { isSupported } = await KeepAwake.isSupported();
      if (isSupported) {
        await KeepAwake.keepAwake();
      }
    } catch(e) {
      console.warn('KeepAwake non supportato o fallito', e);
    }
  }
}
