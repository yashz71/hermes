import { TestBed } from '@angular/core/testing';

import { Charts } from './charts';

describe('Charts', () => {
  let service: Charts;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Charts);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
