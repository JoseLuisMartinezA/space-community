import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as UserType } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, userData: Omit<UserType, 'id' | 'email' | 'role'>) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (updatedUser: Partial<UserType>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Mounting');

    // Check active session
    const getSession = async () => {
      console.log('AuthProvider: Getting session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider: Session result', { session, error });

        if (error) {
          console.error('AuthProvider: Error getting session', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('AuthProvider: User found, fetching profile', session.user.id);
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          console.log('AuthProvider: No session, setting loading false');
          setLoading(false);
        }
      } catch (err) {
        console.error('AuthProvider: Unexpected error in getSession', err);
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state change', event);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    console.log('AuthProvider: fetchProfile start', userId);
    try {
      // Create a timeout promise that rejects after 5 seconds
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch request timed out')), 5000)
      );

      // Race the actual request against the timeout
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        timeoutPromise
      ]) as { data: any; error: any };

      console.log('AuthProvider: fetchProfile result', { data, error });

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        // Map DB columns to User type if needed, assuming match
        setUser({
          id: data.id,
          email: data.email || email,
          name: data.name,
          handle: data.handle,
          role: data.role,
          bio: data.bio,
          avatar: data.avatar || data.avatar_url // Handle potential naming diff
        });
      } else {
        // Fallback if profile missing
        console.log('AuthProvider: No profile data found, using fallback');
        setUser({
          id: userId,
          email,
          name: 'User',
          handle: 'user',
          role: 'user',
          bio: '',
          avatar: ''
        });
      }
    } catch (error) {
      console.error("Profile fetch error", error)
    } finally {
      console.log('AuthProvider: fetchProfile finished, setting loading false');
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const register = async (email: string, password: string, userData: Omit<UserType, 'id' | 'email' | 'role'>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          handle: userData.handle,
          avatar_url: userData.avatar,
          bio: userData.bio,
        }
      }
    });

    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updatedData: Partial<UserType>) => {
    if (!user || !user.id) return;

    // Filter out fields that shouldn't be updated directly or map them
    const dbUpdate: any = {};
    if (updatedData.name) dbUpdate.name = updatedData.name;
    if (updatedData.handle) dbUpdate.handle = updatedData.handle;
    if (updatedData.bio) dbUpdate.bio = updatedData.bio;
    if (updatedData.avatar) dbUpdate.avatar = updatedData.avatar;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdate)
      .eq('id', user.id);

    if (!error) {
      setUser(prev => prev ? ({ ...prev, ...updatedData }) : null);
    } else {
      console.error("Error updating profile", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isAuthenticated: !!user, loading }}>
      {loading ? (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-dark text-primary font-mono animate-pulse">
          Iniciando Protocolos...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
