import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  phone: string | null;
  default_address: string | null;
  city: string | null;
  pincode: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (name: string, email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  loading: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkIsAdmin = (email: string | undefined) => {
    return email?.endsWith('@natureswheel.com') ?? false;
  };

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user);
      setUser(session?.user ?? null);
      setIsAdmin(checkIsAdmin(session?.user?.email));
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user);
      setUser(session?.user ?? null);
      setIsAdmin(checkIsAdmin(session?.user?.email));
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      console.log('Fetched profile:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message);
        return { error };
      }

      if (data.user) {
        console.log('Login successful:', data.user);
        setIsAdmin(checkIsAdmin(data.user.email));
        await fetchProfile(data.user.id);
        toast.success('Welcome back!');
      }

      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login');
      return { error };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('Attempting registration for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      if (data.user) {
        console.log('Registration successful:', data.user);
        setIsAdmin(checkIsAdmin(data.user.email));
        toast.success('Registration successful! Please verify your email.');
      }

      return { error: null };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register');
      return { error };
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting logout');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast.error('Failed to log out');
        throw error;
      }
      
      // Clear all auth-related state
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      
      // Clear any stored session
      localStorage.removeItem('supabase.auth.token');
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
      throw error;
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        logout,
        loading,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};