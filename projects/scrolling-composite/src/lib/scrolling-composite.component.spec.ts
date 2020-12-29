import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollingCompositeComponent } from './scrolling-composite.component';
import {BehaviorSubject} from 'rxjs';

describe('ScrollingCompositeComponent', () => {
  let component: ScrollingCompositeComponent;
  let fixture: ComponentFixture<ScrollingCompositeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScrollingCompositeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScrollingCompositeComponent);
    component = fixture.componentInstance;
    component.compositeHeight = new BehaviorSubject(100);
    component.compositeWidth = new BehaviorSubject<number>(100);
    component.startAutomatically = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the correct canvas dimensions upon first render', async () => {
    await fixture.whenRenderingDone();
    expect(component.canvasElementRef.nativeElement.width).toEqual(component.compositeWidth.getValue());
    expect(component.canvasElementRef.nativeElement.height).toEqual(component.compositeHeight.getValue());
  });

  it('updates the dimensions of the underlying canvas', async () => {
    component.compositeWidth.next(Math.round((Math.random() + 1) * 100)); // whole number between 100 and 1000
    component.compositeHeight.next(Math.round((Math.random() + 1) * 100)); // whole number between 100 and 1000
    await fixture.whenRenderingDone();
    expect(component.canvasElementRef.nativeElement.width).toEqual(component.compositeWidth.getValue());
    expect(component.canvasElementRef.nativeElement.height).toEqual(component.compositeHeight.getValue());
  });


  it('does not leave gaps in the composite', () => {
    expect(component.columnCount * component.actualImageSize).toEqual(component.compositeWidth.getValue());
  });
});
