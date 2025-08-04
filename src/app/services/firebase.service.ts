import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';

// Firebase imports
import { initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  DocumentData
} from 'firebase/firestore';
import {
  RemoteConfig,
  fetchAndActivate,
  getRemoteConfig,
  getValue
} from 'firebase/remote-config';

// User model interface
export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  youtubeChannelName: string;
  address: string;
  phoneNumber: string;
  credits: number;
  createdAt: any;
}

// Report interface
export interface Report {
  id?: string;
  userId: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  createdAt: any;
  reportData: any;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private auth: Auth = getAuth(this.app);
  private firestore: Firestore = getFirestore(this.app);
  private remoteConfig: RemoteConfig = getRemoteConfig(this.app);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  userProfile$ = this.userProfileSubject.asObservable();

  constructor() {
    // Initialize Remote Config with default values
    this.remoteConfig.defaultConfig = environment.remoteConfigDefaults;

    // Set minimum fetch interval for development
    this.remoteConfig.settings.minimumFetchIntervalMillis = environment.production ? 3600000 : 0;

    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);

      if (user) {
        this.getUserProfile(user.uid).then(profile => {
          this.userProfileSubject.next(profile);
        });
      } else {
        this.userProfileSubject.next(null);
      }
    });

    // Fetch remote config values
    this.fetchRemoteConfig();
  }

  // Authentication methods
  signUp(email: string, password: string, userData: Partial<UserProfile>): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        // Create user profile in Firestore with 10 initial credits
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || email,
          fullName: userData.fullName || '',
          youtubeChannelName: userData.youtubeChannelName || '',
          address: userData.address || '',
          phoneNumber: userData.phoneNumber || '',
          credits: 2, // Initial credits
          createdAt: serverTimestamp()
        };

        await setDoc(doc(this.firestore, 'users', user.uid), userProfile);
        return userCredential;
      });
  }

  signIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signOut(): Promise<void> {
    return signOut(this.auth).then(() => {
      this.userProfileSubject.next(null);
    });
  }

  // User profile methods
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      } else {
        console.log('No user profile found');
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(this.firestore, 'users', uid);
    return updateDoc(docRef, data).then(() => {
      // Update the local BehaviorSubject with the new data
      const currentProfile = this.userProfileSubject.value;
      if (currentProfile) {
        this.userProfileSubject.next({
          ...currentProfile,
          ...data
        });
      }
    });
  }

  // Credit system methods
  async deductCredit(uid: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(uid);

      if (!userProfile || userProfile.credits < 1) {
        return false; // Not enough credits
      }

      await this.updateUserProfile(uid, {
        credits: userProfile.credits - 1
      });

      return true; // Credit deducted successfully
    } catch (error) {
      console.error('Error deducting credit:', error);
      return false;
    }
  }

  // Report methods
  async saveReport(userId: string, videoId: string, videoTitle: string, videoUrl: string, reportData: any): Promise<string> {
    try {
      const report: Report = {
        userId,
        videoId,
        videoTitle,
        videoUrl,
        createdAt: serverTimestamp(),
        reportData
      };

      const docRef = await addDoc(collection(this.firestore, 'users', userId, 'reports'), report);
      return docRef.id;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  async getReports(userId: string): Promise<Report[]> {
    try {
      const reportsRef = collection(this.firestore, 'users', userId, 'reports');
      const q = query(reportsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data() as Report;
        return {
          ...data,
          id: doc.id
        };
      });
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  }

  async getReport(userId: string, reportId: string): Promise<Report | null> {
    try {
      const docRef = doc(this.firestore, 'users', userId, 'reports', reportId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Report;
        return {
          ...data,
          id: docSnap.id
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting report:', error);
      return null;
    }
  }

  // Remote Config methods
  private async fetchRemoteConfig(): Promise<void> {
    try {
      await fetchAndActivate(this.remoteConfig);
      console.log('Remote config fetched and activated');
    } catch (error) {
      console.error('Error fetching remote config:', error);
    }
  }

  getRemoteConfigValue(key: string): string {
    try {
      const value = getValue(this.remoteConfig, key);
      return value.asString();
    } catch (error) {
      console.error(`Error getting remote config value for ${key}:`, error);
      return '';
    }
  }

  // Specific getters for our API keys
  getGeminiApiKey(): string {
    return this.getRemoteConfigValue('gemini_2_5_flash_key');
  }

  getYoutubeApiKey(): string {
    return this.getRemoteConfigValue('youtube_api_key');
  }
}
