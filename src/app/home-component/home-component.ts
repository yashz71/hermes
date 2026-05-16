import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit,viewChild, ElementRef, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../services/auth-service';
import { ChatService } from '../services/chat-service';
import { AnyCnameRecord } from 'node:dns';

@Component({
  selector: 'app-home-component',
  imports: [ 
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'app-home-host',
    '[class.sidebar-collapsed]': 'isSidebarCollapsed()',
  }
})
export class HomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly chatService = inject(ChatService);
  private readonly scrollContainer = viewChild<ElementRef>('scrollFrame');
  readonly isSidebarCollapsed = signal(window.innerWidth < 768);
  readonly user = this.authService.currentUser;
  readonly messages = this.chatService.messages;
  readonly isWaiting = this.chatService.isWaitingForAi;
  readonly conversations = this.chatService.threads;
  readonly selectedFile = signal<File | null>(null);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly chatForm = this.fb.nonNullable.group({
    prompt: ['', [Validators.required]]
  });

  ngOnInit(): void {
    
      this.chatService.loadUserThreads();
      effect(() => {
        this.messages(); // track the signal
        this.scrollToBottom();
      });
    
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
  
    if (file && file.type !== 'application/pdf') {
      console.warn('Only PDF files are allowed');
      return;
    }
  
    this.selectedFile.set(file);
  }
  
  triggerFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }
  parseAiResponse(raw: any): string {
    try {
      const parsed = JSON.parse(raw);
      return parsed.answer || raw;
    } catch {
      return raw;
    }
  }
  private scrollToBottom(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (el) {
      setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 100);
    }
  }
  selectThread(threadId: string): void {
    this.chatService.loadThreadHistory(threadId);
    console.log("select thread: ",this.messages);
    // Auto-collapse sidebar on mobile after selection
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed.set(true);
    }
  }

  startNewChat(): void {
    this.chatService.startNewChat();
    this.chatForm.reset();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

 
  sendMessage(): void {
    const user = this.user();
  
    if (this.chatForm.valid && user) {
      const prompt = this.chatForm.controls.prompt.value;
  
      this.chatService.sendMessage(
        prompt,
        user.userId,
        this.selectedFile()
      );
  
      this.chatForm.reset();
      this.selectedFile.set(null); // 🔥 reset after send
    }
  }
}