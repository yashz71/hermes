import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class StreamingService {

  private socket: Socket;

  // Optional: connection state
  readonly connected = signal(false);

  constructor() {
    this.socket = io('http://localhost:3000', {
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
    });

    this.socket.on('disconnect', () => {
      this.connected.set(false);
    });
  }

  listen<T>(event: string, handler: (data: T) => void): void {
    this.socket.on(event, handler);
  }
}