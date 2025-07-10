import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, Profile, getProfile, signOut as supabaseSignOut } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    setUser(user);

    if (user) {
      try {
        const profile = await getProfile(user.id);
        setProfile(profile);
      } catch (err) {
        console.error("Profile load error", err);
      }
    }

    setLoading(false);
  };

  init();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
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
  isAuthenticated: !!user,
  refreshProfile,
  signOut,
};

};