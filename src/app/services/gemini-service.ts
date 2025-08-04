import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

// ############################################################################
// HOW TO USE THIS SERVICE IN YOUR ANGULAR COMPONENT
// ############################################################################
//
// 1. **Import the Service:**
//    In your component file (e.g., `report-page.component.ts`), import this service:
//    `import { GeminiService } from './path/to/gemini.service';`
//
// 2. **Inject the Service:**
//    Add it to the constructor of your component:
//    `constructor(private geminiService: GeminiService) {}`
//
// 3. **Call the analyzeComments Method:**
//    After fetching your video details and comments from the YouTube Data API,
//    call the method and subscribe to the result.
//
//    public async generateReport() {
//      const videoTitle = 'Your Video Title From YouTube API';
//      const videoDescription = 'Your video description...';
//      const comments = [ /* Array of comment objects from YouTube API */ ];
//
//      try {
//        const report = await this.geminiService.analyzeComments(videoTitle, videoDescription, comments);
//        // Now you have the structured report object.
//        // You can bind `report.writtenAnalysis`, `report.atAGlanceSummary`, etc.,
//        // to your component's properties and render them in your template.
//        console.log(report);
//      } catch (error) {
//        console.error('Error generating report:', error);
//        // Handle the error in your UI (e.g., show a notification)
//      }
//    }
//
// ############################################################################


// --- TypeScript Interfaces for the Structured JSON Response ---
// These interfaces define the shape of the data we expect back from Gemini.

export interface MostLikedComment {
  commentText: string;
  likeCount: number;
  author: string;
}

export interface AtAGlanceSummary {
  overallSentiment: string;
  topThemes: string[];
  mostLikedComments: MostLikedComment[];
}

export interface KeyTheme {
  themeTitle: string;
  explanation: string;
  supportingComments: string[];
}

export interface ActionableOpportunities {
  contentRequests: string[];
  merchandiseIdeas: string[];
  engagementOpportunities: string[];
  brandIdentity: string[];
}

export interface EmotionalAnalysis {
  emotionBreakdown: EmotionCategory[];
  constructiveCriticism: CriticismItem[];
  timestampHighlights: TimestampHighlight[];
}

export interface EmotionCategory {
  emotion: string; // Joy, Humor, Surprise, Confusion, Frustration, Appreciation
  percentage: number;
  exampleComments: string[];
}

export interface CriticismItem {
  comment: string;
  type: 'constructive' | 'non-constructive';
  actionable: boolean;
}

export interface TimestampHighlight {
  timestamp: string;
  comment: string;
  reaction: string;
}

export interface QuestionIdentification {
  questions: string[];
  topicCategories: {
    topic: string;
    questions: string[];
  }[];
}

export interface AudienceInsights {
  viewerPersonas: ViewerPersona[];
  communityHealthScore: number;
  communityHealthAnalysis: string;
  languageToneProfile: LanguageToneProfile;
  powerCommenters: {
    name: string;
    comments: number;
    impact: string;
  }[];
}

export interface ViewerPersona {
  personaName: string;
  description: string;
  characteristics: string[];
  exampleComments: string[];
}

export interface LanguageToneProfile {
  formalityLevel: string;
  technicalLevel: string;
  emotionalTone: string;
  commonPhrases: string[];
}

export interface ContextualAnalysis {
  titleFeedback: string[];
  thumbnailFeedback: string[];
  expectationVsReality: {
    promised: string[];
    delivered: string[];
    gaps: string[];
  };
  seoSuggestions: string[];
}

export interface EnhancedActionPlan {
  contentIdeas: ActionItem[];
  communityEngagementTactics: ActionItem[];
  videoOptimizationTips: ActionItem[];
}

export interface ActionItem {
  suggestion: string;
  supportingEvidence: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface AnalysisReport {
  writtenAnalysis: string;
  atAGlanceSummary: AtAGlanceSummary;
  keyThemeDeepDive: KeyTheme[];
  actionableOpportunities: ActionableOpportunities;
  // New sections
  emotionalAnalysis: EmotionalAnalysis;
  questionIdentification: QuestionIdentification;
  audienceInsights: AudienceInsights;
  contextualAnalysis: ContextualAnalysis;
  enhancedActionPlan: EnhancedActionPlan;
}


@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  // API key is fetched from Firebase Remote Config
  private API_KEY: string = "";
  private API_URL: string = "";

  constructor(private firebaseService: FirebaseService) {
    // Get the API key from Firebase Remote Config
    this.API_KEY = this.firebaseService.getGeminiApiKey();
    this.API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.API_KEY}`;
  }

  /**
   * Analyzes YouTube comments and returns a structured report.
   * @param videoTitle The title of the YouTube video.
   * @param videoDescription The description of the YouTube video.
   * @param comments An array of comment objects from the YouTube Data API.
   * @returns A promise that resolves to a structured AnalysisReport object.
   */
  public async analyzeComments(
    videoTitle: string,
    videoDescription: string,
    comments: any[]
  ): Promise<AnalysisReport> {

    // 1. Format the comments into a simple string for the prompt.
    // Validate and sanitize each comment before formatting
    const validComments = comments.filter(comment =>
      comment &&
      typeof comment === 'object' &&
      (comment.textDisplay || comment.textOriginal) &&
      comment.authorDisplayName
    );

    console.log(`Formatting ${validComments.length} valid comments for Gemini API`);

    // If no valid comments, provide a clear message
    if (validComments.length === 0) {
      console.warn("No valid comments to analyze. Using fallback message.");
      const fallbackReport: AnalysisReport = {
        writtenAnalysis: `The requested analysis of YouTube comments for the video "${videoTitle}" cannot be performed as no valid comment data was provided. All comment entries were marked as 'undefined' for author, likes, and comment text.`,
        atAGlanceSummary: {
          overallSentiment: "Undeterminable due to lack of comment data",
          topThemes: [],
          mostLikedComments: []
        },
        keyThemeDeepDive: [],
        actionableOpportunities: {
          contentRequests: [],
          merchandiseIdeas: [],
          engagementOpportunities: [],
          brandIdentity: []
        },
        // New sections with empty/default values
        emotionalAnalysis: {
          emotionBreakdown: [],
          constructiveCriticism: [],
          timestampHighlights: []
        },
        questionIdentification: {
          questions: [],
          topicCategories: []
        },
        audienceInsights: {
          viewerPersonas: [],
          communityHealthScore: 0,
          communityHealthAnalysis: "No data available due to lack of comments",
          languageToneProfile: {
            formalityLevel: "Unknown",
            technicalLevel: "Unknown",
            emotionalTone: "Unknown",
            commonPhrases: []
          },
          powerCommenters: []
        },
        contextualAnalysis: {
          titleFeedback: [],
          thumbnailFeedback: [],
          expectationVsReality: {
            promised: [],
            delivered: [],
            gaps: []
          },
          seoSuggestions: []
        },
        enhancedActionPlan: {
          contentIdeas: [],
          communityEngagementTactics: [],
          videoOptimizationTips: []
        }
      };
      return fallbackReport;
    }

    const formattedComments = validComments
      .map(comment => {
        const author = comment.authorDisplayName || 'Anonymous';
        const likes = typeof comment.likeCount === 'number' ? comment.likeCount : 0;
        const text = comment.textDisplay || comment.textOriginal || 'No text';
        return `Author: ${author}\nLikes: ${likes}\nComment: ${text}\n---`;
      })
      .join('\n');

    // 2. Construct the detailed prompt for Gemini.
    const prompt = `
      You are a YouTube channel analyst. Your task is to analyze the comments for a video and generate a structured JSON report.

      **Video Context:**
      - **Title:** "${videoTitle}"
      - **Description:** "${videoDescription}"

      **Comments to Analyze:**
      ${formattedComments}

      **Instructions:**
      Based on the video context and the comments provided, generate a JSON object that adheres to the provided schema. The analysis should be insightful and helpful for the YouTube creator.

      - **First, write a detailed 'writtenAnalysis'**: This should be a 2-3 paragraph narrative summary explaining the overall findings. It should touch on the general sentiment, the main topics of discussion, and the key opportunities you discovered.
      - For 'overallSentiment', provide a percentage breakdown (e.g., "95% Positive / 5% Neutral").
      - For 'topThemes', identify the 5 most discussed topics.
      - For 'mostLikedComments', list the top 3 comments with the most likes.
      - For 'keyThemeDeepDive', create 2-3 detailed sections on the most important themes.
      - For 'actionableOpportunities', find specific, actionable suggestions from the comments. If a category has no items, return an empty array.

      **Enhanced Analysis Instructions:**

      - For 'emotionalAnalysis':
        - Classify comments by emotions (Joy, Humor, Surprise, Confusion, Frustration, Appreciation)
        - Differentiate between constructive criticism and non-constructive trolling:
          - For 'constructiveCriticism', include at least 2-3 examples of both constructive and non-constructive feedback
          - Constructive criticism should have 'type' set to 'constructive' and include actionable feedback
          - Non-constructive criticism should have 'type' set to 'non-constructive' and include examples of trolling or unhelpful comments
          - Set 'actionable' to true for feedback that the creator can act upon
        - Identify comments that reference specific timestamps and explain why viewers highlighted them

      - For 'questionIdentification':
        - Extract all substantive questions asked in the comments
        - Categorize questions by topic

      - For 'audienceInsights':
        - Generate 2-3 viewer personas based on comment patterns
        - Provide a community health score (1-10) and analysis
        - Analyze the language and tone profile of the audience
        - Identify power commenters who drive engagement

      - For 'contextualAnalysis':
        - Analyze feedback about the video's title and thumbnail
        - Compare the video's promised content vs. what viewers perceived
        - Suggest keywords for SEO based on comment content

      - For 'enhancedActionPlan':
        - Categorize actionable suggestions into content ideas, community engagement tactics, and video optimization tips
        - For each suggestion, provide 2-3 supporting comment quotes as evidence
        - Assign priority levels to each suggestion (high, medium, low)
    `;

    // 3. Define the strict JSON schema for the expected output.
    const schema = {
      type: "OBJECT",
      properties: {
        "writtenAnalysis": {
          type: "STRING",
          description: "A detailed 2-3 paragraph narrative summary of the overall analysis, sentiment, themes, and opportunities."
        },
        "atAGlanceSummary": {
          type: "OBJECT",
          properties: {
            "overallSentiment": { type: "STRING" },
            "topThemes": {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            "mostLikedComments": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "commentText": { type: "STRING" },
                  "likeCount": { type: "NUMBER" },
                  "author": { type: "STRING" }
                }
              }
            }
          }
        },
        "keyThemeDeepDive": {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              "themeTitle": { type: "STRING" },
              "explanation": { type: "STRING" },
              "supportingComments": {
                type: "ARRAY",
                items: { type: "STRING" }
              }
            }
          }
        },
        "actionableOpportunities": {
          type: "OBJECT",
          properties: {
            "contentRequests": {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            "merchandiseIdeas": {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            "engagementOpportunities": {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            "brandIdentity": {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          }
        },
        "emotionalAnalysis": {
          type: "OBJECT",
          properties: {
            "emotionBreakdown": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "emotion": { type: "STRING" },
                  "percentage": { type: "NUMBER" },
                  "exampleComments": {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  }
                }
              }
            },
            "constructiveCriticism": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "comment": { type: "STRING" },
                  "type": { type: "STRING" },
                  "actionable": { type: "BOOLEAN" }
                }
              }
            },
            "timestampHighlights": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "timestamp": { type: "STRING" },
                  "comment": { type: "STRING" },
                  "reaction": { type: "STRING" }
                }
              }
            }
          }
        },
        "questionIdentification": {
          type: "OBJECT",
          properties: {
            "questions": {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            "topicCategories": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "topic": { type: "STRING" },
                  "questions": {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  }
                }
              }
            }
          }
        },
        "audienceInsights": {
          type: "OBJECT",
          properties: {
            "viewerPersonas": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "personaName": { type: "STRING" },
                  "description": { type: "STRING" },
                  "characteristics": {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  },
                  "exampleComments": {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  }
                }
              }
            },
            "communityHealthScore": { type: "NUMBER" },
            "communityHealthAnalysis": { type: "STRING" },
            "languageToneProfile": {
              type: "OBJECT",
              properties: {
                "formalityLevel": { type: "STRING" },
                "technicalLevel": { type: "STRING" },
                "emotionalTone": { type: "STRING" },
                "commonPhrases": {
                  type: "ARRAY",
                  items: { type: "STRING" }
                }
              }
            },
            "powerCommenters": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "name": { type: "STRING" },
                  "comments": { type: "NUMBER" },
                  "impact": { type: "STRING" }
                }
              }
            }
          }
        },
        "contextualAnalysis": {
          type: "OBJECT",
          properties: {
            "titleFeedback": {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            "thumbnailFeedback": {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            "expectationVsReality": {
              type: "OBJECT",
              properties: {
                "promised": {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                "delivered": {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                "gaps": {
                  type: "ARRAY",
                  items: { type: "STRING" }
                }
              }
            },
            "seoSuggestions": {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          }
        },
        "enhancedActionPlan": {
          type: "OBJECT",
          properties: {
            "contentIdeas": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "suggestion": { type: "STRING" },
                  "supportingEvidence": {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  },
                  "priority": { type: "STRING" }
                }
              }
            },
            "communityEngagementTactics": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "suggestion": { type: "STRING" },
                  "supportingEvidence": {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  },
                  "priority": { type: "STRING" }
                }
              }
            },
            "videoOptimizationTips": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "suggestion": { type: "STRING" },
                  "supportingEvidence": {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  },
                  "priority": { type: "STRING" }
                }
              }
            }
          }
        }
      }
    };


    // 4. Prepare the payload for the Gemini API.
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    };

    // 5. Make the API call and handle the response.
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {

        const jsonText = result.candidates[0].content.parts[0].text;
        // The response is a stringified JSON, so we need to parse it.
        const parsedReport = JSON.parse(jsonText) as AnalysisReport;

        // Log the report data for debugging
        console.log("Gemini API Response (parsed):", parsedReport);

        return parsedReport;
      } else {
        // Handle cases where the response structure is unexpected.
        console.error("Unexpected API response structure:", result);
        throw new Error("Failed to parse the analysis report from the API response.");
      }

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      // Re-throw the error so the calling component can handle it.
      throw error;
    }
  }
}
