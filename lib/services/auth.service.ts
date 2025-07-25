import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged, 
  GoogleAuthProvider,
  User as FirebaseUser,
  Unsubscribe
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/lib/types';

export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // Initialize current user state
    firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      this.currentUser = firebaseUser ? this.transformFirebaseUser(firebaseUser) : null;
    });
  }

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    const user = this.transformFirebaseUser(result.user);
    this.currentUser = user;
    
    return user;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      const user = firebaseUser ? this.transformFirebaseUser(firebaseUser) : null;
      this.currentUser = user;
      callback(user);
    });
  }

  async isAuthenticated(): Promise<boolean> {
    return this.currentUser !== null;
  }

  private transformFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || null
    };
  }
}

// Export singleton instance
export const authService = new AuthService();