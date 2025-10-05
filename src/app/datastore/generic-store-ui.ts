
import {CdkTableModule, DataSource} from '@angular/cdk/table';
import { Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
 
import { BehaviorSubject, Observable, tap } from 'rxjs';

export class CDKDataSource<T> extends DataSource<T> {
  
  private _data: T[] = [];

  constructor(private dataSignal: Signal<T[]>) {
    super();
  }

  connect(): Observable<T[]> {
     return toObservable(this.dataSignal).pipe(
      tap(data => this._data = data)
    );
  }

  disconnect() {}
}