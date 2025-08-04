import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';

// Services
import { FirebaseService, Report } from '../services/firebase.service';
import { VideoComment } from '../services/youtube-api.service';
import { CriticismItem } from '../services/gemini-service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    // PrimeNG
    CardModule,
    ChartModule,
    TableModule,
    ToastModule,
    DividerModule,
    AccordionModule
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  providers: [MessageService]
})
export class ReportComponent implements OnInit, OnDestroy {
  reportId: string = '';
  report: Report | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  // Chart data
  sentimentChartData: any;
  sentimentChartOptions: any;
  commentsTimelineData: any;
  commentsTimelineOptions: any;

  private routeSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe(params => {
      if (params['id']) {
        this.reportId = params['id'];
        this.loadReport();
      } else {
        this.error = 'No report ID provided';
        this.isLoading = false;
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

  loadReport(): void {
    this.isLoading = true;
    this.error = null;

    this.userSubscription = this.firebaseService.userProfile$.subscribe(userProfile => {
      if (!userProfile) {
        this.error = 'User not authenticated';
        this.isLoading = false;
        return;
      }

      this.firebaseService.getReport(userProfile.uid, this.reportId)
        .then(report => {
          if (report) {
            this.report = report;
            // Log the report data for debugging
            console.log("Report data from Firebase:", report);
            console.log("Report data structure:", report.reportData);
            this.initializeCharts();
          } else {
            this.error = 'Report not found';
          }
          this.isLoading = false;
        })
        .catch(error => {
          this.error = `Error loading report: ${error.message}`;
          this.isLoading = false;
        });
    });
  }

  initializeCharts(): void {
    if (!this.report || !this.report.reportData) {
      console.log("No report data available for charts");
      return;
    }

    const reportData = this.report.reportData;
    console.log("Initializing charts with report data:", reportData);

    // Check for expected data structures
    console.log("atAGlanceSummary:", reportData.atAGlanceSummary);
    console.log("keyThemeDeepDive:", reportData.keyThemeDeepDive);
    console.log("actionableOpportunities:", reportData.actionableOpportunities);

    // Check if the data structure matches what the template expects
    console.log("topThemes (expected in template as topCommentThemes):",
      reportData.atAGlanceSummary?.topThemes);
    console.log("mostLikedComments:",
      reportData.atAGlanceSummary?.mostLikedComments);
    console.log("keyThemes (expected in template, but provided as keyThemeDeepDive):",
      reportData.keyThemes);

    // Initialize sentiment chart
    if (reportData.atAGlanceSummary && reportData.atAGlanceSummary.overallSentiment) {
      let positive = 0;
      let neutral = 0;
      let negative = 0;

      const sentiment = reportData.atAGlanceSummary.overallSentiment;
      console.log("Sentiment data for chart:", sentiment);

      // Check if sentiment is a string (from Gemini API) or an object (expected by chart)
      if (typeof sentiment === 'string') {
        console.log("Sentiment is a string, parsing:", sentiment);

        // Parse the sentiment string (e.g., "95% Positive / 5% Neutral")
        try {
          // Extract percentages using regex
          const positiveMatch = sentiment.match(/(\d+)%\s*Positive/i);
          const neutralMatch = sentiment.match(/(\d+)%\s*Neutral/i);
          const negativeMatch = sentiment.match(/(\d+)%\s*Negative/i);

          positive = positiveMatch ? parseInt(positiveMatch[1]) : 0;
          neutral = neutralMatch ? parseInt(neutralMatch[1]) : 0;
          negative = negativeMatch ? parseInt(negativeMatch[1]) : 0;

          console.log("Parsed sentiment values:", { positive, neutral, negative });
        } catch (error) {
          console.error("Error parsing sentiment string:", error);
        }
      } else if (typeof sentiment === 'object') {
        // If it's already an object with the expected properties
        positive = sentiment.positive || 0;
        neutral = sentiment.neutral || 0;
        negative = sentiment.negative || 0;
      }

      this.sentimentChartData = {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [
          {
            data: [positive, neutral, negative],
            backgroundColor: ['#10b981', '#6b7280', '#ef4444'],
            hoverBackgroundColor: ['#059669', '#4b5563', '#dc2626']
          }
        ]
      };

      this.sentimentChartOptions = {
        plugins: {
          legend: {
            position: 'right'
          }
        },
        responsive: true,
        maintainAspectRatio: false
      };
    }

    // Initialize comments timeline chart with comments grouped by date
    // Get comments from report data
    const comments = this.report?.reportData?.comments || [];

    // Take the top 100 most relevant comments (they're already ordered by relevance from the YouTube API)
    const topComments = comments.slice(0, 100);

    // Group comments by date (using publishedAt field)
    const commentsByDate = new Map<string, number>();

    // Track if we have valid comments with dates
    let hasValidComments = false;

    topComments.forEach((comment: VideoComment) => {
      if (comment.publishedAt) {
        // Extract just the date part (YYYY-MM-DD) from the ISO string
        const dateStr = comment.publishedAt.split('T')[0];

        // Increment the count for this date
        const currentCount = commentsByDate.get(dateStr) || 0;
        commentsByDate.set(dateStr, currentCount + 1);
        hasValidComments = true;
      }
    });

    // Convert the Map to arrays for the chart
    let sortedDates: string[] = [];
    let commentCounts: number[] = [];
    let formattedDates: string[] = [];

    if (hasValidComments && commentsByDate.size > 0) {
      // Sort dates chronologically
      sortedDates = Array.from(commentsByDate.keys()).sort();
      commentCounts = sortedDates.map(date => commentsByDate.get(date) || 0);

      // Format dates for display (e.g., "Jan 1, 2023")
      formattedDates = sortedDates.map(dateStr => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      });
    } else {
      // Provide fallback data if no valid comments with dates are found
      console.log("No valid comments with dates found, using fallback data");

      // Create fallback data with the last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const dateStr = date.toISOString().split('T')[0];
        sortedDates.push(dateStr);

        // Random comment count between 0-5 for sample data
        const randomCount = Math.floor(Math.random() * 6);
        commentCounts.push(randomCount);

        formattedDates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      }
    }

    this.commentsTimelineData = {
      labels: formattedDates,
      datasets: [
        {
          label: 'Comments',
          data: commentCounts,
          backgroundColor: '#f59e0b',
          hoverBackgroundColor: '#f59e0bdd'
        }
      ]
    };

    this.commentsTimelineOptions = {
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Comments by Time',
          font: {
            size: 16
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Comments'
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'x' // Vertical bar chart
    };
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  shareReport(): void {
    // In a real implementation, this would generate a shareable link
    this.messageService.add({
      severity: 'info',
      summary: 'Share Report',
      detail: 'Sharing functionality will be available in a future update'
    });
  }

  downloadReport(): void {
    // In a real implementation, this would generate a PDF or other downloadable format
    this.messageService.add({
      severity: 'info',
      summary: 'Download Report',
      detail: 'Download functionality will be available in a future update'
    });
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

  // Helper method to get color for emotion
  getEmotionColor(emotion: string): string {
    const emotionColors: {[key: string]: string} = {
      'Joy': '#10b981', // green
      'Humor': '#f59e0b', // amber
      'Surprise': '#3b82f6', // blue
      'Confusion': '#8b5cf6', // purple
      'Frustration': '#ef4444', // red
      'Appreciation': '#06b6d4', // cyan
      'Excitement': '#f97316', // orange
      'Curiosity': '#6366f1', // indigo
      'Disappointment': '#f43f5e', // rose
      'Concern': '#a855f7' // purple
    };

    return emotionColors[emotion] || '#6b7280'; // default gray
  }

  // Helper method to filter constructive criticism
  getConstructiveCriticism(): CriticismItem[] {
    console.log('Checking constructive criticism data:', this.report?.reportData?.emotionalAnalysis?.constructiveCriticism);

    if (!this.report?.reportData?.emotionalAnalysis?.constructiveCriticism) {
      console.log('No constructive criticism data found');
      return [];
    }

    const constructiveItems = this.report.reportData.emotionalAnalysis.constructiveCriticism.filter(
      (item: CriticismItem) => item.type === 'constructive'
    );

    console.log('Filtered constructive items:', constructiveItems);
    return constructiveItems;
  }

  // Helper method to filter non-constructive criticism
  getNonConstructiveCriticism(): CriticismItem[] {
    if (!this.report?.reportData?.emotionalAnalysis?.constructiveCriticism) {
      console.log('No constructive criticism data found');
      return [];
    }

    const nonConstructiveItems = this.report.reportData.emotionalAnalysis.constructiveCriticism.filter(
      (item: CriticismItem) => item.type === 'non-constructive'
    );

    console.log('Filtered non-constructive items:', nonConstructiveItems);
    return nonConstructiveItems;
  }

  // Helper method to get color for community health score
  getCommunityHealthColor(score: number): string {
    if (score >= 8) return '#10b981'; // green for high scores
    if (score >= 5) return '#f59e0b'; // amber for medium scores
    return '#ef4444'; // red for low scores
  }

  // Helper method to get CSS class based on priority
  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-amber-500';
      case 'low':
        return 'border-blue-500';
      default:
        return 'border-gray-300';
    }
  }

  // Helper method to get CSS class for priority badge
  getPriorityBadgeClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
