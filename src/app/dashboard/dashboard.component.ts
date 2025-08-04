import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { FirebaseService, UserProfile, Report } from '../services/firebase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    TableModule,
    ToastModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [MessageService]
})
export class DashboardComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  reports: Report[] = [];
  videoForm!: FormGroup;
  isLoading = false;
  isLoadingReports = true;

  private userSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private router: Router,
    private snackBar: MatSnackBar,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadUserProfile();
    // Reports will be loaded after userProfile is available
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.videoForm = this.fb.group({
      videoUrl: ['', [Validators.required, this.youtubeUrlValidator]]
    });
  }

  loadUserProfile(): void {
    this.userSubscription = this.firebaseService.userProfile$.subscribe(profile => {
      this.userProfile = profile;
      if (profile) {
        this.loadReports();
      }
    });
  }

  async loadReports(): Promise<void> {
    this.isLoadingReports = true;

    try {
      if (this.userProfile) {
        this.reports = await this.firebaseService.getReports(this.userProfile.uid);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load your reports'
      });
    } finally {
      this.isLoadingReports = false;
    }
  }

  onSubmit(): void {
    if (this.videoForm.invalid) {
      return;
    }

    const videoUrl = this.videoForm.value.videoUrl;

    // Check if user has enough credits
    if (this.userProfile && this.userProfile.credits < 1) {
      this.snackBar.open('You do not have enough credits to analyze a video', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Navigate to analyze page with the video URL
    this.router.navigate(['/analyze'], {
      queryParams: { url: videoUrl }
    });
  }

  viewReport(reportId: string): void {
    this.router.navigate(['/report', reportId]);
  }

  signOut(): void {
    this.firebaseService.signOut()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(error => {
        console.error('Error signing out:', error);
      });
  }

  // Custom validator for YouTube URLs
  youtubeUrlValidator(control: { value: string }): { [key: string]: boolean } | null {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

    if (control.value && !youtubeRegex.test(control.value)) {
      return { invalidYoutubeUrl: true };
    }

    return null;
  }

  // Helper method to extract video ID from YouTube URL
  getVideoId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : '';
  }

  // Helper method to format date
  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
