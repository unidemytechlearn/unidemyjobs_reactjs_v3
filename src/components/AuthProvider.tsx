import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {auth.loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};