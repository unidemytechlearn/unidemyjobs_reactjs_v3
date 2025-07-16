import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, Profile, getProfile, signOut as supabaseSignOut } from '../lib/supabase';
import { createNotification, NotificationTemplates } from '../lib/notifications';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    setUser(user);

    if (user) {
      try {
        const profile = await getProfile(user.id);
        
        if (!profile) {
          console.warn('User authenticated but no profile found:', user.id);
          // We'll still set the user as authenticated but with no profile
        }
        
        setProfile(profile);
        
        // Create welcome notification for new users
        if (profile && !profile.created_at) {
          try {
            const template = NotificationTemplates.WELCOME();
            await createNotification(
              user.id,
              template.title,
              template.message,
              template.type,
              '/dashboard/profile'
            );
            console.log('Welcome notification created for new user');
          } catch (error) {
            console.error('Error creating welcome notification:', error);
          }
        }
      } catch (err) {
        console.error("Profile load error", err);
        setAuthError("Failed to load user profile");
      }
    }

    setLoading(false);
  };

  init();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    if (event === 'SIGNED_OUT') {
      setUser(null);
      setProfile(null);
    } else if (session?.user) {
      setUser(session.user);
      getProfile(session.user.id).then(setProfile).catch(() => setProfile(null));
    }
  });

  return () => subscription.unsubscribe();
}, []);


  const refreshProfile = async () => {
    if (user) {
      try {
        setProfileLoading(true);
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      } finally {
        setProfileLoading(false);
      }
    }
  };

  const signOut = async () => {
  try {
    await supabase.auth.signOut();        // Perform actual sign out
    setUser(null);                        // Clear local user state
    setProfile(null);                     // Clear profile
    setLoading(false);                    // Reset loading if needed
  } catch (error) {
    console.error("Error during sign out:", error);
  }
};


  return {
  user,
  profile,
  loading,
  authError,
  isAuthenticated: !!user,
  refreshProfile,
  signOut,
};

};