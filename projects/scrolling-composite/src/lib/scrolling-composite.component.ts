import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, Subscription, timer} from 'rxjs';

enum ScrollDirectionType {
  FALLING,
  RISING
}

/**
 * A scrolling composite of square images. The composite will scroll infinitely. When the last available image
 * has been drawn the composite will begin to repeat itself.
 */
@Component({
  selector: 'lib-scrolling-composite[images][compositeHeight][compositeWidth]',
  template: `
    <canvas #canvas></canvas>
  `,
})
export class ScrollingCompositeComponent implements OnInit, OnDestroy {
  static ScrollDirectionType = ScrollDirectionType;

  /**
   * The canvas is filled with the backgroundColor upon ScrollingCompositeComponent's construction.
   * Once {@link start} is invoked the backgroundColor will no longer be visible.
   */
  @Input() backgroundColor = 'white';

  /**
   * Describes how new images are added to the composite. If FALLING new rows will be appended
   * to the top of the composite. If RISING new rows will be appended to the bottom of the composite.
   */
  @Input() scrollDirection = ScrollDirectionType.RISING;

  /**
   * An array of images to be included in the composite. As of the current version of scrolling-composite,
   * Images can not be added or removed from the composite after it has been created. Warning: The array
   * you pass in will be frozen using Object.freeze() after start() start() is invoked.
   * Make a defensive copy if you still need to mutate the array.
   */
  @Input() images: ImageBitmap[];

  /**
   * The height of the canvas that will render the ScrollingComposite.
   */
  @Input() compositeHeight: BehaviorSubject<number>;

  /**
   * The width of the canvas that will render the ScrollingComposite.
   */
  @Input() compositeWidth: BehaviorSubject<number>;

  /**
   * Every element in the composite will have a uniform size that is approximately equal to this value.
   * The actual uniform image size may be slightly bigger depending on the width of the composite.
   * All elements in a composite must be square, hence there is no need for separate preferredImageWidth and preferredImageHeight
   * properties.
   */
  @Input() preferredImageSize = new BehaviorSubject(50);

  /**
   * If true the composite will be rendered immediately and begin scrolling. If false the composite will
   * not be drawn until {@link start} is invoked.
   */
  @Input() startAutomatically = true;

  /**
   * The amount of time in milliseconds it takes for one row to ascend/descend to it's next position on the page.
   */
  @Input() scrollSpeed = 5000;

  /**
   * The amount of time in milliseconds between canvas re-draws.
   */
  @Input() redrawRate = 20;

  /**
   * A reference to the underlying canvas that the composite is drawn on.
   * @private
   */
  @ViewChild('canvas', { static: true }) canvasElementRef: ElementRef<HTMLCanvasElement>;

  /**
   * In order to function properly this component must subscribe to various data sources.
   * This array tracks these subscriptions. All subscriptions stored in this array will be released
   * when the component is destroyed.
   */
  private subscriptions: Array<Subscription> = [];

  /**
   * Weather or not {@link start} has been invoked on this ScrollingComposite.
   */
  private isStarted = false;

  /**
   * The index of the first image in the current page.
   */
  private index = 0;

  /**
   * The number of pixels that the index row will be offset.
   */
  private offset = 0;
  constructor() {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.compositeHeight.subscribe((height) => {
        this.canvasElementRef.nativeElement.height = height;
      })
    );
    this.subscriptions.push(
      this.compositeWidth.subscribe((width) => {
        this.canvasElementRef.nativeElement.width = width;
      })
    );
    this.fillBackgroundColor();
    if (this.startAutomatically) {
      this.start();
    }
  }
  private fillBackgroundColor(): void {
    const context = this.canvasElementRef.nativeElement.getContext('2d');
    context.fillStyle = this.backgroundColor;
    context.fillRect(0, 0, this.compositeWidth.getValue(), this.compositeHeight.getValue());
  }

  start(): void {
    if (this.isStarted) {
      throw new Error('The composite has already been started.');
    }
    // Editing the array while the render thread is running will cause jumping.
    // For this reason editing the array is disallowed.
    Object.freeze(this.images);
    this.subscriptions.push(
      timer(undefined, this.redrawRate).subscribe(() => {
        this.draw();
      })
    );
    this.isStarted = true;
  }

  /**
   * Returns the number of rows that this composite is divided into. Row count is not explicitly set.
   * To control the number of rows you may adjust the {@link compositeHeight} and {@link preferredImageSize}.
   */
  get rowCount(): number {
    // Round up to the next row. That way there are no blank rows in the composite.
    return Math.ceil(this.compositeHeight.getValue() / this.actualImageSize);
  }

  /**
   * The number of columns that this composite is divided into. Column count is not explicitly set.
   * To control the number of columns you may adjust the {@link compositeWidth} and {@link preferredImageSize}
   * properties.
   */
  get columnCount(): number {
    return Math.floor(this.compositeWidth.getValue() / this.preferredImageSize.getValue());
  }

  /**
   * Returns the uniform size of each image in the composite. The actualImageSize might be slightly bigger
   * than {@link preferredImageSize} depending on the width of the composite. This ensures that there are no
   * gaps in the composite.
   */
  get actualImageSize(): number {
    // The amount of horizontal space in the composite (measured in pixels along the x-axis) that would not be
    // occupied by an image.
    const horizontalGap = this.compositeWidth.getValue() - this.columnCount * this.preferredImageSize.getValue();
    // Return an image size that removes any gaps in the composite.
    return (horizontalGap / this.columnCount) + this.preferredImageSize.getValue();
  }

  private draw(): void {
    // The draw function needs to be quicker than the redrawRate.
    const iterator: RepeatingIterator<ImageBitmap> = new RepeatingIterator(this.images);
    const context: CanvasRenderingContext2D = this.canvasElementRef.nativeElement.getContext('2d');
    // Avoid potential integer overflow by resetting the index.
    this.index = iterator.normalizeIndex(this.index);
    // Prepare the iterator before we begin drawing. Need to make sure we're starting with the right
    // image in the array.
    if (this.index > 0) {
      range(0, this.index).forEach(() => iterator.next());
    }
    context.clearRect(0, 0, this.compositeWidth.getValue(), this.compositeHeight.getValue());
    if (this.scrollDirection === ScrollDirectionType.RISING) {
      for (let y = 0 - this.offset; y < this.compositeHeight.getValue(); y += this.actualImageSize) {
        for (let columnI = 0; columnI < this.columnCount; columnI++) {
          const [image, _] = iterator.next();
          const x = this.actualImageSize * columnI;
          context.drawImage(image, x, y, this.actualImageSize, this.actualImageSize);
        }
      }
      // The number of pixels we need to move the row per millisecond in order to achieve the
      // desired scrollSpeed.
      const offsetChangePerMs = this.actualImageSize / this.scrollSpeed;
      const totalOffsetChangePerDraw = this.redrawRate * offsetChangePerMs;
      this.offset += totalOffsetChangePerDraw;
      // If we are offsetting by a full row, then just increment the index and reset the offset.
      if (this.offset >= this.actualImageSize) {
        this.index += this.columnCount;
        this.offset = 0;
      }
    } else {
      throw new Error('ScrollDirection.FALLING is currently unsupported.');
    }
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}

class RepeatingIterator<T> {
  private index = 0;
  private readonly array: Array<T>;
  constructor(array: Array<T>) {
    this.array = Array.from(array); // defensive copy
  }

  /**
   * Returns the next element in the array. If the end of the array has been reached the first
   * element (index 0) will be returned and iteration will continue from that point.
   */
  next(): [T, number] {
    if (this.array.length === 0) {
      throw new Error('There must be at least one element in the underlying array at all times.');
    }
    const result: [T, number] = [this.array[this.index], this.index];
    this.index++;
    if (this.index >= this.array.length) {
      this.index = 0;
    }
    return result;
  }
  normalizeIndex(index: number): number {
    if (index < this.array.length) {
      // The index is already normal
      return index;
    } else {
      return index % this.array.length;
    }
  }
}

function range(startAt: number, stopBefore: number): Array<number> {
  if (startAt >= stopBefore) {
    throw new Error('startAt must be less than stopBefore.');
  }
  const numbers: Array<number> = [];
  for (let i = startAt; i < stopBefore; i++) {
    numbers.push(i);
  }
  return numbers;
}

export async function createImageBitmapUniversal(blob: Blob): Promise<ImageBitmap> {
  if (window.createImageBitmap) {
    return createImageBitmap(blob);
  } else {
    // createImageBitmap is only supported by Google Chrome.
    // If we are using a different browser we need to polyfill.
    // https://gist.github.com/nektro/84654b5183ddd1ccb7489607239c982d
    // explains how to do this.
    const image = document.createElement('img');
    const loaded = new Promise(resolve => {
      image.addEventListener('load', resolve);
    });
    image.src = URL.createObjectURL(blob);
    await loaded;
    // HTMLImageElement implements ImageBitmap apparently.
    return image as unknown as ImageBitmap;
  }
}
