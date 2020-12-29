import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, fromEvent, Subscription} from 'rxjs';
import { createImageBitmapUniversal } from 'scrolling-composite';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions: Array<Subscription> = [];
  width = new BehaviorSubject(window.innerWidth);
  height = new BehaviorSubject(window.innerHeight);
  images: Array<ImageBitmap> = [];
  loaded = false;
  preferredImageSize = new BehaviorSubject(100);
  ngOnInit(): void {
    this.subscriptions.push(
      fromEvent(window, 'resize').subscribe(() => {
        this.width.next(window.innerWidth);
        this.height.next(window.innerHeight);
      })
    );

    this.loadImages();
  }

  async loadImages(): Promise<void> {
    const assets = [
      'Dark_Side_of_the_Moon.png',
      'is_this_it.jpg',
      'torches.jpg',
      'goth_babe.jpg',
      'lana.jpg',
      'monkeys.jpg',
      'stones.jpg',
      'yellow_sub.jpg',
      'adele.jpg',
      'michael.jpg',
      'taylorswift.png',
      'youngthegiant.jpg',
      'lorde.jpg',
      'miley.png',
      'hendrix.jpg',
      'hendrix2.jpg',
      'skynard.jpg'
    ];
    for (const asset of assets) {
      const result = await fetch('./assets/' + asset, {
        method: 'GET',
      });

      const image = await createImageBitmapUniversal(await result.blob());
      this.images.push(image);
    }
    this.loaded = true;
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}
