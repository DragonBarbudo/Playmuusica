import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jellyfinService } from '../services/jellyfin';
import { supabase } from '../services/supabase';
import type { User } from '../types/user';
import type { JellyfinAuthResponse } from '../types/jellyfin';

interface AuthContextType {
  user: User | null;
  jellyfinAuth: JellyfinAuthResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [jellyfinAuth, setJellyfinAuth] = useState<JellyfinAuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      setIsLoading(true);

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Get user data from database
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            jellyfinUserId: userData.jellyfin_user_id,
            jellyfinUsername: userData.jellyfin_username,
            subscriptionStatus: userData.subscription_status,
            subscriptionType: userData.subscription_type,
            subscriptionId: userData.subscription_id,
            subscriptionEndDate: userData.subscription_end_date,
            createdAt: userData.created_at,
            updatedAt: userData.updated_at,
          });
        }
      }

      // Check Jellyfin auth
      if (jellyfinService.isAuthenticated()) {
        // Jellyfin token exists, but we should validate it
        // For now, we'll trust it exists
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);

      // 1. Authenticate with Jellyfin
      const jellyfinResponse = await jellyfinService.authenticate(username, password);
      setJellyfinAuth(jellyfinResponse);

      // 2. Check if user exists in Supabase, if not create them
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('jellyfin_user_id', jellyfinResponse.User.Id)
        .single();

      if (existingUser) {
        // User exists, sign them in with Supabase
        // Note: You'll need to implement a custom auth flow or use Supabase's email/password
        // For now, we'll just set the user state
        setUser({
          id: existingUser.id,
          email: existingUser.email,
          jellyfinUserId: existingUser.jellyfin_user_id,
          jellyfinUsername: existingUser.jellyfin_username,
          subscriptionStatus: existingUser.subscription_status,
          subscriptionType: existingUser.subscription_type,
          subscriptionId: existingUser.subscription_id,
          subscriptionEndDate: existingUser.subscription_end_date,
          createdAt: existingUser.created_at,
          updatedAt: existingUser.updated_at,
        });
      } else {
        // Create new user in Supabase
        // Note: For a production app, you should have a proper signup flow
        // This is a simplified version
        const email = `${username}@muusica.com`; // Placeholder email

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email,
            jellyfin_user_id: jellyfinResponse.User.Id,
            jellyfin_username: jellyfinResponse.User.Name,
            subscription_status: 'inactive',
          })
          .select()
          .single();

        if (createError) {
          throw new Error('Failed to create user in database');
        }

        if (newUser) {
          setUser({
            id: newUser.id,
            email: newUser.email,
            jellyfinUserId: newUser.jellyfin_user_id,
            jellyfinUsername: newUser.jellyfin_username,
            subscriptionStatus: newUser.subscription_status,
            subscriptionType: newUser.subscription_type,
            subscriptionId: newUser.subscription_id,
            subscriptionEndDate: newUser.subscription_end_date,
            createdAt: newUser.created_at,
            updatedAt: newUser.updated_at,
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await jellyfinService.logout();
      await supabase.auth.signOut();
      setUser(null);
      setJellyfinAuth(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('users')
        .select('subscription_status, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (!data) return false;

      const isActive = data.subscription_status === 'active';
      const notExpired = data.subscription_end_date
        ? new Date(data.subscription_end_date) > new Date()
        : false;

      return isActive && notExpired;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  };

  const hasActiveSubscription =
    user?.subscriptionStatus === 'active' &&
    (user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) > new Date() : false);

  const value: AuthContextType = {
    user,
    jellyfinAuth,
    isLoading,
    isAuthenticated: !!user && jellyfinService.isAuthenticated(),
    hasActiveSubscription,
    login,
    logout,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
