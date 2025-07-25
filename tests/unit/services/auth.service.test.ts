import { AuthService } from '@/lib/services/auth.service';
import { User } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  User as FirebaseUser 
} from 'firebase/auth';

// Mock Firebase auth
jest.mock('@/lib/firebase', () => ({
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({})),
}));

describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('signInWithGoogle', () => {
    it('should authenticate user with Google credentials', async () => {
      // Arrange
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };
      
      const mockCredential = {
        user: mockFirebaseUser
      };
      
      (signInWithPopup as jest.Mock).mockResolvedValue(mockCredential);
      
      // Act
      const result = await authService.signInWithGoogle();
      
      // Assert
      expect(result).toMatchObject({
        id: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      });
      
      expect(signInWithPopup).toHaveBeenCalledWith(
        auth,
        {}
      );
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const mockError = new Error('Authentication failed');
      (signInWithPopup as jest.Mock).mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(authService.signInWithGoogle())
        .rejects.toThrow('Authentication failed');
    });

    it('should handle user cancellation', async () => {
      // Arrange
      const mockError = { code: 'auth/popup-closed-by-user' };
      (signInWithPopup as jest.Mock).mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(authService.signInWithGoogle())
        .rejects.toMatchObject({ code: 'auth/popup-closed-by-user' });
    });
  });

  describe('signOut', () => {
    it('should sign out current user', async () => {
      // Arrange
      (signOut as jest.Mock).mockResolvedValue(undefined);
      
      // Act
      await authService.signOut();
      
      // Assert
      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('should handle sign out errors', async () => {
      // Arrange
      const mockError = new Error('Sign out failed');
      (signOut as jest.Mock).mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(authService.signOut())
        .rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user if authenticated', () => {
      // Arrange
      const mockUser: User = {
        id: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null
      };
      
      // Assuming authService has a private property for current user
      (authService as any).currentUser = mockUser;
      
      // Act
      const result = authService.getCurrentUser();
      
      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return null if not authenticated', () => {
      // Act
      const result = authService.getCurrentUser();
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChanged', () => {
    it('should subscribe to auth state changes', () => {
      // Arrange
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);
      
      // Act
      const unsubscribe = authService.onAuthStateChanged(mockCallback);
      
      // Assert
      expect(onAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should transform Firebase user to app user format', () => {
      // Arrange
      const mockCallback = jest.fn();
      let authStateCallback: any;
      
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return jest.fn();
      });
      
      authService.onAuthStateChanged(mockCallback);
      
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };
      
      // Act
      authStateCallback(mockFirebaseUser);
      
      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        id: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      });
    });

    it('should call callback with null when user signs out', () => {
      // Arrange
      const mockCallback = jest.fn();
      let authStateCallback: any;
      
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return jest.fn();
      });
      
      authService.onAuthStateChanged(mockCallback);
      
      // Act
      authStateCallback(null);
      
      // Assert
      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      // Arrange
      const mockUser: User = {
        id: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null
      };
      
      (authService as any).currentUser = mockUser;
      
      // Act
      const result = await authService.isAuthenticated();
      
      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      // Arrange
      (authService as any).currentUser = null;
      
      // Act
      const result = await authService.isAuthenticated();
      
      // Assert
      expect(result).toBe(false);
    });
  });
});