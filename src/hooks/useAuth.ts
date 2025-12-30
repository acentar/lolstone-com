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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserRole(session.user, session);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
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
    console.log('checkUserRole started for:', user.id);

    try {
      // First, try direct GM table check (simpler, no RPC dependency)
      console.log('Checking GM table directly...');
      const { data: gmData, error: gmError } = await supabase
        .from('game_masters')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Direct GM check result:', { gmData, gmError });

      if (gmData && !gmError) {
        console.log('User is a Game Master!');
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

      // Fallback: Try RPC function
      console.log('Trying RPC function...');
      try {
        const { data: isGM, error: rpcError } = await supabase
          .rpc('is_game_master', { user_uuid: user.id });

        console.log('RPC GM check result:', { isGM, rpcError });

        if (isGM && !rpcError) {
          // Fetch GM data
          const { data: gmDataRpc } = await supabase
            .from('game_masters')
            .select('*')
            .eq('user_id', user.id)
            .single();

          setState({
            session,
            user,
            isGameMaster: true,
            gameMaster: gmDataRpc,
            player: null,
            loading: false,
          });
          return;
        }
      } catch (rpcError) {
        console.log('RPC function not available, skipping:', rpcError);
      }

      // Check if user is a Player
      console.log('Checking if user is a player...');
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Player check result:', { playerData, playerError });

      setState({
        session,
        user,
        isGameMaster: false,
        gameMaster: null,
        player: playerData,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking user role:', error);
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

