# ScrollingComposite
An angular component for rendering infinitely scrolling square composites like the
one shown below. See bottom of README for an example.

## Features
- Tested on both Chrome and Safari.
- Customizable scroll speed.
- Customizable refresh rate.
- You can adjust the dimensions of the composite in realtime via BehaviorSubject
- You can adjust the image size in realtime via BehaviorSubject.

## Caveats
- Only supports square images. The whole composite may be rectangular however.
- Can not add/remove images after the composite has been created. All images must be
loaded into memory before rendering the composite.
- Some modern browsers like Safari and Firefox do not support `window.createImageBitmap`. 
The utility function `createImageBitmapUniversal(blob: Blob): Promise<ImageBitmap>`
  has been included so that ScrollingComposite can still be used with these browsers. You
  should use `createImageBitmapUniversal` as a drop-in replacement for `window.createImageBitmap`.
  
## Basic Usage Example
### app.component.ts
```ts
export class AppComponent {
  width = new BehaviorSubject(window.innerWidth);
  height = new BehaviorSubject(window.innerHeight);
  images: Array<ImageBitmap> = [
      /* ImageBitmaps go here */
  ];
  preferredImageSize = new BehaviorSubject(100);
}
```

### app.component.html
```angular2html
<lib-scrolling-composite [compositeHeight]="this.height"
                         [compositeWidth]="this.width"
                         [images]="this.images"
                         [scrollSpeed]="5000"
                         [preferredImageSize]="this.preferredImageSize"
  ></lib-scrolling-composite>
```

### app.module.ts
```ts
import { ScrollingCompositeModule } from 'scrolling-composite';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ScrollingCompositeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
