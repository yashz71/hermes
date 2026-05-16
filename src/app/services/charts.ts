import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { HttpParams } from '@angular/common/http';
import { StreamingService } from './streaming-service';
export interface MarketDataPoint {
  id: number;
  asset_name: string; // Unified name from dim_asset
  asset_type: 'stock' | 'currency' | 'commodity' | 'bond';
  price_value: number;
  dayChangePct?: number;
  created_at: string | Date; // Use the market timestamp
}

export interface MarketOverview {
  stocks: MarketDataPoint[];
  currencies: MarketDataPoint[];
  commodities: MarketDataPoint[];
  bonds: MarketDataPoint[];
}
@Injectable({
  providedIn: 'root',
})
export class Charts {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/charts';
  private socket!: Socket;
  private readonly realtime = inject(StreamingService);

  // State Management using Signals
  // We store an array for each market type
  readonly #stocks = signal<MarketDataPoint[]>([]);
  readonly #currencies = signal<MarketDataPoint[]>([]);
  readonly #commodities = signal<MarketDataPoint[]>([]);
  readonly #bonds = signal<MarketDataPoint[]>([]);
  readonly #isLoading = signal<boolean>(false);

  readonly isLoading = this.#isLoading.asReadonly();

  // Exposed Read-only Signals
  readonly stocks = this.#stocks.asReadonly();
  readonly currencies = this.#currencies.asReadonly();
  readonly commodities = this.#commodities.asReadonly();
  readonly bonds = this.#bonds.asReadonly();

  constructor() {
    this.initializeRealtime();
  }

  // 🔥 REALTIME HOOK
  private initializeRealtime(): void {
    this.realtime.listen<MarketOverview>('web_gold', (update) => {
      console.log('[Socket] Incoming:', update);

      this.#stocks.set(update.stocks);
      this.#currencies.set(update.currencies);
      this.#commodities.set(update.commodities);
      this.#bonds.set(update.bonds);    
    });
  }
  
loadOverview(timeframe: string = '1w'): void {
  this.#isLoading.set(true);
  
  
  
  this.http.get<MarketOverview>(`${this.baseUrl}/overview/${timeframe}`,{ withCredentials: true })
    .subscribe({
      next: (data) => {
        this.#stocks.set(data.stocks);
        this.#currencies.set(data.currencies);
        this.#commodities.set(data.commodities);
        this.#bonds.set(data.bonds);
        this.#isLoading.set(false);
        

      },
      error: (err) => {
        console.error('Failed to load market overview', err);
        this.#isLoading.set(false);
      }
    });
}

  // private initializeWebSockets(): void {
  //   // Connect to the NestJS Gateway
  //   this.socket = io('http://localhost:3000');

  //   this.socket.on('market_data_stream', (update: MarketDataPoint) => {
  //     this.handleIncomingUpdate(update);
  //   });
  // }

  // private handleIncomingUpdate(update: MarketDataPoint): void {
  //   // Identify the type of data by checking unique keys
  //   if (update.stocksName) this.appendUpdate(this.#stocks, update);
  //   else if (update.currenciesName) this.appendUpdate(this.#currencies, update);
  //   else if (update.commodityName) this.appendUpdate(this.#commodities, update);
  //   else if (update.bondsName) this.appendUpdate(this.#bonds, update);
  // }

  // private appendUpdate(target: ReturnType<typeof signal<MarketDataPoint[]>>, point: MarketDataPoint): void {
  //   target.update((current) => {
  //     const updated = [...current, point];
  //     // Optional: Keep only the last 100 points to prevent memory leaks/browser lag
  //     return updated.length > 100 ? updated.slice(1) : updated;
  //   });
  // }

  
  
}