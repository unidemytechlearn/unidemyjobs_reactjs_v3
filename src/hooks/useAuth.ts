import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, Profile, getProfile, signOut as supabaseSignOut } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }
        
        if (session?.user && mounted) {
          setUser(session.user);
          setProfileLoading(true);
          
          try {
            const userProfile = await getProfile(session.user.id);
            if (mounted) {
              setProfile(userProfile);
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            if (mounted) {
              setProfile(null);
            }
          } finally {
            if (mounted) {
              setProfileLoading(false);
            }
          }
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          setProfileLoading(false);
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session.user);
          setProfileLoading(true);
          
          try {
            const userProfile = await getProfile(session.user.id);
            if (mounted) {
              setProfile(userProfile);
            }
          } catch (error) {
            console.error('Error fetching profile after auth change:', error);
            if (mounted) {
              setProfile(null);
            }
          } finally {
            if (mounted) {
              setProfileLoading(false);
            }
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        setProfileLoading(true);
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabaseSignOut();
      // State will be cleared by the auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    loading: loading || !initialized,
    profileLoading,
    isAuthenticated: !!user && initialized,
    refreshProfile,
    signOut,
  };
};