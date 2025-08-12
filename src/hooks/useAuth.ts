import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, Profile, getProfile, signOut as supabaseSignOut } from '../lib/supabase';
import { createNotification, NotificationTemplates } from '../lib/notifications';

// Helper function to handle Google OAuth callback
const handleGoogleAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  
  if (role) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!existingProfile) {
        // Create profile with the specified role
        const profileData = {
          id: user.id,
          first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
          last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          role: role,
          email_notifications: true,
          job_alerts: role === 'job_seeker',
          application_updates: true,
          marketing_emails: false,
          profile_visibility: 'public',
          show_salary: false,
          show_contact: true,
          two_factor_enabled: false,
          profile_views: 0
        };
        
        await supabase.from('profiles').insert(profileData);
      } else if (existingProfile.role !== role) {
        // Role mismatch - sign out and show error
        await supabase.auth.signOut();
        throw new Error(`This Google account is registered as a ${existingProfile.role}. Please use the correct sign-in form.`);
      }
    }
    
    // Clear the role parameter from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
  const init = async () => {
    // Handle Google OAuth callback
    try {
      await handleGoogleAuthCallback();
    } catch (error) {
      console.error('Google auth callback error:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication error');
    }

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