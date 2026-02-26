import { useAuthStore, type AuthState } from '@/stores/auth';

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear store before each test
    useAuthStore.getState().logout();
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();
    
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set auth correctly', () => {
    const { setAuth } = useAuthStore.getState();
    
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
    };
    
    setAuth(user, 'access-token', 'refresh-token');
    
    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should logout correctly', () => {
    const { setAuth, logout } = useAuthStore.getState();
    
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
    };
    
    setAuth(user, 'access-token', 'refresh-token');
    logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should update user correctly', () => {
    const { setAuth, updateUser } = useAuthStore.getState();
    
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
    };
    
    setAuth(user, 'access-token', 'refresh-token');
    updateUser({ name: 'Updated Name' });
    
    const state = useAuthStore.getState();
    expect(state.user?.name).toBe('Updated Name');
    expect(state.user?.email).toBe('test@example.com'); // unchanged
  });
});
