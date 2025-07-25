import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { authService } from '@/lib/services/auth.service';
import { User } from '@/lib/types';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {}
}));

// Mock AuthService
jest.mock('@/lib/services/auth.service', () => ({
  authService: {
    onAuthStateChanged: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn()
  }
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set user when authenticated', async () => {
    const mockUser: User = {
      id: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null
    };

    // Mock the onAuthStateChanged to immediately call the callback
    (authService as any).onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useAuth());

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle unauthenticated state', async () => {
    (authService as any).onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle sign in', async () => {
    const mockUser: User = {
      id: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null
    };

    (authService as any).signInWithGoogle.mockResolvedValue(mockUser);
    (authService as any).onAuthStateChanged.mockImplementation((callback) => {
      callback(null); // Start unauthenticated
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect((authService as any).signInWithGoogle).toHaveBeenCalled();
  });

  it('should handle sign in errors', async () => {
    const mockError = new Error('Sign in failed');
    (authService as any).signInWithGoogle.mockRejectedValue(mockError);
    (authService as any).onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe('Sign in failed');
  });

  it('should handle sign out', async () => {
    (authService as any).signOut.mockResolvedValue(undefined);
    (authService as any).onAuthStateChanged.mockImplementation((callback) => {
      callback({ id: 'test', email: 'test@example.com', displayName: 'Test', photoURL: null });
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect((authService as any).signOut).toHaveBeenCalled();
  });

  it('should handle sign out errors', async () => {
    const mockError = new Error('Sign out failed');
    (authService as any).signOut.mockRejectedValue(mockError);
    (authService as any).onAuthStateChanged.mockImplementation((callback) => {
      callback({ id: 'test', email: 'test@example.com', displayName: 'Test', photoURL: null });
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.error).toBe('Sign out failed');
  });

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = jest.fn();
    (authService as any).onAuthStateChanged.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should clear error when signing in again', async () => {
    const mockUser: User = {
      id: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null
    };

    // First attempt fails
    (authService as any).signInWithGoogle.mockRejectedValueOnce(new Error('Failed'));
    // Second attempt succeeds
    (authService as any).signInWithGoogle.mockResolvedValueOnce(mockUser);
    
    (authService as any).onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    // First sign in attempt (fails)
    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe('Failed');

    // Second sign in attempt (succeeds)
    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBeNull();
  });

  it('should provide isAuthenticated computed property', async () => {
    let authCallback: ((user: User | null) => void) | null = null;
    
    (authService as any).onAuthStateChanged.mockImplementation((callback) => {
      authCallback = callback;
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(false);

    // Update to authenticated state
    await act(async () => {
      if (authCallback) {
        authCallback({ id: 'test', email: 'test@example.com', displayName: 'Test', photoURL: null });
      }
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});