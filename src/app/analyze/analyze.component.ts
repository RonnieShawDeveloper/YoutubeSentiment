import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

// PrimeNG Imports
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { FirebaseService, UserProfile } from '../services/firebase.service';
import { YoutubeApiService, VideoDetails, VideoComment } from '../services/youtube-api.service';
import { GeminiService, AnalysisReport } from '../services/gemini-service';

@Component({
  selector: 'app-analyze',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    // PrimeNG
    ProgressBarModule,
    ToastModule
  ],
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css'],
  providers: [MessageService]
})
export class AnalyzeComponent implements OnInit, OnDestroy {
  videoUrl: string = '';
  videoId: string = '';
  videoDetails: VideoDetails | null = null;
  comments: VideoComment[] = [];
  userProfile: UserProfile | null = null;

  isLoading: boolean = false;
  currentStep: number = 0;
  steps: string[] = [
    'Validating video URL',
    'Fetching video details',
    'Collecting comments',
    'Analyzing content',
    'Generating report',
    'Saving results'
  ];
  error: string | null = null;
  reportId: string | null = null;

  private routeSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private youtubeApiService: YoutubeApiService,
    private geminiService: GeminiService,
    private snackBar: MatSnackBar,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Get user profile
    this.userSubscription = this.firebaseService.userProfile$.subscribe(profile => {
      this.userProfile = profile;
    });

    // Get video URL from query params
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      if (params['url']) {
        this.videoUrl = params['url'];
        this.startAnalysis();
      } else {
        this.error = 'No video URL provided';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No video URL provided'
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  startAnalysis(): void {
    if (!this.videoUrl) {
      this.error = 'Please provide a YouTube video URL';
      return;
    }

    if (!this.userProfile) {
      this.error = 'User profile not loaded';
      return;
    }

    if (this.userProfile.credits < 1) {
      this.error = 'Not enough credits to perform analysis';
      this.messageService.add({
        severity: 'error',
        summary: 'Insufficient Credits',
        detail: 'You need at least 1 credit to analyze a video'
      });
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.currentStep = 0;

    // Step 1: Validate URL and extract video ID
    this.videoId = this.youtubeApiService.extractVideoId(this.videoUrl);
    if (!this.videoId) {
      this.handleError('Invalid YouTube URL');
      return;
    }

    this.currentStep = 1;

    // Step 2 & 3: Deduct credit and fetch video data
    this.firebaseService.deductCredit(this.userProfile.uid)
      .then(success => {
        if (!success) {
          this.handleError('Failed to deduct credit');
          return;
        }

        // Fetch video details and comments (up to 200)
        this.youtubeApiService.getVideoAnalysisData(this.videoId, 200)
          .pipe(
            finalize(() => {
              if (this.error) {
                this.isLoading = false;
              }
            })
          )
          .subscribe({
            next: (data) => {
              this.videoDetails = data.videoDetails;
              this.comments = data.comments;
              this.currentStep = 3;

              // Step 4: Analyze comments with Gemini
              this.analyzeWithGemini();
            },
            error: (error) => {
              this.handleError(`Error fetching video data: ${error.message}`);
            }
          });
      })
      .catch(error => {
        this.handleError(`Error deducting credit: ${error.message}`);
      });
  }

  analyzeWithGemini(): void {
    if (!this.videoDetails) {
      this.handleError('No video details to analyze');
      return;
    }

    if (this.comments.length === 0) {
      this.handleError('No comments found for this video. The video may have comments disabled.');
      return;
    }

    // Validate comment data structure
    const validComments = this.comments.filter(comment =>
      comment &&
      typeof comment === 'object' &&
      (comment.textDisplay || comment.textOriginal) &&
      comment.authorDisplayName &&
      typeof comment.likeCount !== 'undefined'
    );

    if (validComments.length === 0) {
      this.handleError('No valid comment data found. Comment data may be malformed.');
      return;
    }

    if (validComments.length < this.comments.length) {
      console.warn(`Some comments (${this.comments.length - validComments.length}) were filtered out due to missing required fields.`);
      this.comments = validComments;
    }

    this.currentStep = 4;

    console.log("Analyzing comments with Gemini AI...");
    console.log("Video title:", this.videoDetails.title);
    console.log("Number of comments to analyze:", this.comments.length);

    // Log the first few comments to verify structure
    console.log("Comment data sample:", this.comments.slice(0, 3));

    // Log comment structure details for debugging
    const commentStructureCheck = this.comments.slice(0, 5).map(comment => ({
      hasAuthor: !!comment.authorDisplayName,
      authorName: comment.authorDisplayName,
      hasLikeCount: typeof comment.likeCount !== 'undefined',
      likeCount: comment.likeCount,
      hasText: !!(comment.textDisplay || comment.textOriginal),
      textLength: (comment.textDisplay || comment.textOriginal || '').length
    }));
    console.log("Comment structure check:", commentStructureCheck);

    this.geminiService.analyzeComments(
      this.videoDetails.title,
      this.videoDetails.description,
      this.comments
    )
      .then((report: AnalysisReport) => {
        console.log("Gemini analysis complete. Report data:", report);
        this.currentStep = 5;
        this.saveReport(report);
      })
      .catch((error: Error) => {
        console.error("Gemini analysis error:", error);
        this.handleError(`Error analyzing comments: ${error.message}`);
      });
  }

  saveReport(reportData: any): void {
    if (!this.userProfile || !this.videoDetails) {
      this.handleError('Missing user profile or video details');
      return;
    }

    console.log("Saving report to Firebase...");
    console.log("User ID:", this.userProfile.uid);
    console.log("Video ID:", this.videoId);
    console.log("Video title:", this.videoDetails.title);
    console.log("Report data being saved:", reportData);

    this.firebaseService.saveReport(
      this.userProfile.uid,
      this.videoId,
      this.videoDetails.title,
      this.videoUrl,
      reportData
    )
      .then(reportId => {
        console.log("Report saved successfully. Report ID:", reportId);
        this.reportId = reportId;
        this.isLoading = false;
        this.currentStep = 6;

        // Navigate to the report view
        console.log("Navigating to report view in 1.5 seconds...");
        setTimeout(() => {
          this.router.navigate(['/report', reportId]);
        }, 1500);
      })
      .catch(error => {
        console.error("Error saving report:", error);
        this.handleError(`Error saving report: ${error.message}`);
      });
  }

  handleError(message: string): void {
    this.error = message;
    this.isLoading = false;

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }

  cancelAnalysis(): void {
    this.isLoading = false;
    this.router.navigate(['/dashboard']);
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.steps.length) * 100;
  }
}
