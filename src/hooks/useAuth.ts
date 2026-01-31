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

    try {
      // Check game_masters first (RLS allows user to read own row)
      const timeoutMs = 15000;
      const timeoutResult = { data: null as GameMaster | null, error: { message: 'Timeout' } };
      const timeoutPromise = new Promise<typeof timeoutResult>((resolve) =>
        setTimeout(() => resolve(timeoutResult), timeoutMs)
      );

      const gmQueryPromise = supabase
        .from('game_masters')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data, error }) => ({ data, error: error ? { message: error.message } : null }));

      const gmResult = await Promise.race([
        gmQueryPromise,
        timeoutPromise,
      ]);

      const gmData = gmResult.data ?? null;
      const gmError = gmResult.error ?? null;

      if (gmError) {
        console.warn('🔍 GM query error (will check player):', gmError.message);
      }

      if (gmData) {
        console.log('✅ Game Master found:', gmData.email);
        setState({
          session,
          user,
          isGameMaster: true,
          gameMaster: gmData,
          player: null,
          loading: false,
        });
        return;
      }

      // Not a GM — check player table
      console.log('🔍 Checking player status...');
      const playerTimeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), timeoutMs)
      );
      const playerQueryPromise = supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: playerData, error: queryError } = await Promise.race([
        playerQueryPromise,
        playerTimeoutPromise.then((r) => ({ data: r.data, error: r.error }))
      ]) as any;

      if (queryError) {
        console.error('❌ Player query error:', queryError);
      }

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
      console.error('⚠️ checkUserRole error:', err);
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

