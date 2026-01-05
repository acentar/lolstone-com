import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { GameMaster, Player } from '../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  isGameMaster: boolean;
  gameMaster: GameMaster | null;
  player: Player | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isGameMaster: false,
    gameMaster: null,
    player: null,
    loading: true,
  });

  useEffect(() => {
    // Skip auth on server-side rendering
    if (typeof window === 'undefined') {
      console.log('🔐 useAuth: Running on server, skipping auth');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    console.log('🔐 useAuth: Initializing auth in browser...');
    
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('🔐 useAuth: getSession result - session:', !!session, 'error:', error?.message);
        if (error) {
          console.error('🔐 useAuth: getSession error:', error);
          setState(prev => ({ ...prev, loading: false }));
          return;
        }
        if (session?.user) {
          console.log('🔐 useAuth: Found existing session for:', session.user.email);
          checkUserRole(session.user, session);
        } else {
          console.log('🔐 useAuth: No existing session');
          setState(prev => ({ ...prev, loading: false }));
        }
      })
      .catch((err) => {
        console.error('🔐 useAuth: getSession exception:', err);
        setState(prev => ({ ...prev, loading: false }));
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        if (session?.user) {
          await checkUserRole(session.user, session);
        } else {
          setState({
            session: null,
            user: null,
            isGameMaster: false,
            gameMaster: null,
            player: null,
            loading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function checkUserRole(user: User, session: Session) {
    setState(prev => ({ ...prev, loading: true }));
    console.log('🔍 checkUserRole started for:', user.id);

    // Marko's exact GM record from database
    if (user.id === 'e5a761e9-3267-4dc0-9d8d-8d83fcb35cb5') {
      console.log('✅ Marko detected - loading GM account');
      setState({
        session,
        user,
        isGameMaster: true,
        gameMaster: {
          id: '83a296df-f513-4400-8d23-c226232284f4',
          user_id: 'e5a761e9-3267-4dc0-9d8d-8d83fcb35cb5',
          name: 'Marko',
          email: 'supermassivestarcollision@gmail.com',
          created_at: '2025-12-30T14:45:11.013116+00:00',
          updated_at: '2025-12-30T14:45:11.013116+00:00',
        },
        player: null,
        loading: false,
      });
      return;
    }

    // For unknown users, check player table
    console.log('🔍 Checking player status...');
    try {
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('🔍 Player result:', playerData);
      
      setState({
        session,
        user,
        isGameMaster: false,
        gameMaster: null,
        player: playerData,
        loading: false,
      });
    } catch (err) {
      console.log('⚠️ Error:', err);
      setState({
        session,
        user,
        isGameMaster: false,
        gameMaster: null,
        player: null,
        loading: false,
      });
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  }

  async function refreshPlayer() {
    if (!state.user) return;

    try {
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', state.user.id)
        .single();

      if (playerData) {
        setState(prev => ({
          ...prev,
          player: playerData,
        }));
      }
    } catch (error) {
      console.error('Error refreshing player:', error);
    }
  }

  return {
    ...state,
    signIn,
    signOut,
    signUp,
    refreshPlayer,
  };
}

