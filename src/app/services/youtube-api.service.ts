import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FirebaseService } from './firebase.service';
import { Observable, forkJoin, from, of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

export interface VideoDetails {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
}

export interface VideoComment {
  id: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl: string;
  textDisplay: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  replies?: VideoComment[];
}

@Injectable({
  providedIn: 'root'
})
export class YoutubeApiService {
  private apiKey: string = '';
  private apiBaseUrl: string = 'https://www.googleapis.com/youtube/v3';

  constructor(
    private http: HttpClient,
    private firebaseService: FirebaseService
  ) {
    this.apiKey = this.firebaseService.getYoutubeApiKey();
  }

  /**
   * Extract video ID from a YouTube URL
   */
  extractVideoId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : '';
  }

  /**
   * Get video details by ID
   */
  getVideoDetails(videoId: string): Observable<VideoDetails> {
    const params = {
      part: 'snippet,statistics',
      id: videoId,
      key: this.apiKey
    };

    return this.http.get(`${this.apiBaseUrl}/videos`, { params }).pipe(
      map((response: any) => {
        if (!response.items || response.items.length === 0) {
          throw new Error('Video not found');
        }

        const item = response.items[0];
        const snippet = item.snippet;
        const statistics = item.statistics;

        return {
          id: item.id,
          title: snippet.title,
          description: snippet.description,
          publishedAt: snippet.publishedAt,
          channelTitle: snippet.channelTitle,
          viewCount: parseInt(statistics.viewCount) || 0,
          likeCount: parseInt(statistics.likeCount) || 0,
          commentCount: parseInt(statistics.commentCount) || 0,
          thumbnails: snippet.thumbnails
        };
      }),
      catchError(error => {
        console.error('Error fetching video details:', error);
        throw error;
      })
    );
  }

  /**
   * Get comments for a video
   * This method handles pagination to fetch all comments
   */
  getVideoComments(videoId: string, maxResults: number = 100): Observable<VideoComment[]> {
    return this.fetchCommentPage(videoId, maxResults);
  }

  /**
   * Fetch a page of comments with optional pagination token
   */
  private fetchCommentPage(
    videoId: string,
    maxResults: number,
    pageToken?: string,
    allComments: VideoComment[] = []
  ): Observable<VideoComment[]> {
    const params: any = {
      part: 'snippet',
      videoId: videoId,
      maxResults: maxResults > 100 ? 100 : maxResults, // API limit is 100 per request
      key: this.apiKey,
      textFormat: 'plainText',
      order: 'relevance'
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    return this.http.get(`${this.apiBaseUrl}/commentThreads`, { params }).pipe(
      mergeMap((response: any) => {
        if (!response.items) {
          return of(allComments);
        }

        const comments = response.items.map((item: any) => {
          const snippet = item.snippet;
          const topLevelComment = snippet.topLevelComment.snippet;

          return {
            id: item.id,
            authorDisplayName: topLevelComment.authorDisplayName,
            authorProfileImageUrl: topLevelComment.authorProfileImageUrl,
            authorChannelUrl: topLevelComment.authorChannelUrl,
            textDisplay: topLevelComment.textDisplay,
            textOriginal: topLevelComment.textOriginal,
            likeCount: topLevelComment.likeCount,
            publishedAt: topLevelComment.publishedAt,
            updatedAt: topLevelComment.updatedAt,
            replies: snippet.totalReplyCount > 0 ? [] : undefined
          };
        });

        const newAllComments = [...allComments, ...comments];

        // If we have a next page and haven't reached maxResults yet
        if (response.nextPageToken && newAllComments.length < maxResults) {
          return this.fetchCommentPage(
            videoId,
            maxResults - newAllComments.length,
            response.nextPageToken,
            newAllComments
          );
        }

        return of(newAllComments.slice(0, maxResults));
      }),
      catchError(error => {
        console.error('Error fetching video comments:', error);
        // Return empty array instead of throwing to handle videos with comments disabled
        return of([]);
      })
    );
  }

  /**
   * Get both video details and comments in a single call
   */
  getVideoAnalysisData(videoId: string, maxComments: number = 100): Observable<{
    videoDetails: VideoDetails;
    comments: VideoComment[];
  }> {
    return forkJoin({
      videoDetails: this.getVideoDetails(videoId),
      comments: this.getVideoComments(videoId, maxComments)
    }).pipe(
      catchError(error => {
        console.error('Error fetching video analysis data:', error);
        throw error;
      })
    );
  }
}
