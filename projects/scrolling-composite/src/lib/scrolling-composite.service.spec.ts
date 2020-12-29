import { TestBed } from '@angular/core/testing';

import { ScrollingCompositeService } from './scrolling-composite.service';

describe('ScrollingCompositeService', () => {
  let service: ScrollingCompositeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrollingCompositeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
