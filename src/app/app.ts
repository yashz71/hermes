import { Component, signal,OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App  implements OnInit {
  protected readonly title = signal('hermes');
  public authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.authService.checkSession().subscribe({
      next: () => {
        console.log("Session active");
        this.router.navigate(['/Dashboard']);
      },
      error: (err: any) => {
        console.error("Session check failed", err);
      }
    });
  }
}
