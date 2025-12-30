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
      // Use RPC function first (bypasses RLS with SECURITY DEFINER)
      console.log('Checking GM status via RPC...');
      
      let isGM = false;
      let gmData = null;
      
      try {
        const rpcResult = await Promise.race([
          supabase.rpc('is_game_master', { user_uuid: user.id }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 3000))
        ]) as any;
        
        console.log('RPC result:', rpcResult);
        isGM = rpcResult?.data === true;
      } catch (rpcErr) {
        console.log('RPC failed or timed out:', rpcErr);
      }

      if (isGM) {
        console.log('User is GM! Fetching GM data...');
        try {
          const gmResult = await Promise.race([
            supabase.from('game_masters').select('*').eq('user_id', user.id).single(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('GM fetch timeout')), 3000))
          ]) as any;
          gmData = gmResult?.data;
          console.log('GM data fetched:', gmData);
        } catch (gmErr) {
          console.log('GM data fetch failed:', gmErr);
          // Still mark as GM even if we can't fetch the data
          gmData = { id: 'unknown', user_id: user.id, name: 'Game Master', email: user.email };
        }

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

      // Check if user is a Player
      console.log('Checking if user is a player...');
      let playerData = null;
      try {
        const playerResult = await Promise.race([
          supabase.from('players').select('*').eq('user_id', user.id).maybeSingle(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Player fetch timeout')), 3000))
        ]) as any;
        playerData = playerResult?.data;
        console.log('Player check result:', playerData);
      } catch (playerErr) {
        console.log('Player check failed:', playerErr);
      }

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

