/**
 * Game Screen Component - Redesigned Gaming Board
 * 
 * 4:3 responsive canvas with:
 * - Opponent's side (top 30%, scaled 0.9x)
 * - Central Board (middle 40%, 7 slots/side)
 * - Your side (bottom 30%, scaled 1x)
 * - Bandwidth crystals, fanned hand, deck/graveyard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GameState, GameInstance, getValidAttackTargets } from '../../game';
import PlayerProfile from './PlayerProfile';
import GameBoard from './GameBoard';
import Hand from './Hand';
import CardDetailModal from '../CardDetailModal';
import { CardDesignFull } from '../../types/database';

interface GameScreenProps {
  gameInstance: GameInstance;
  playerId: string;
  onGameEnd?: (winnerId: string) => void;
}

const TURN_TIME_LIMIT = 75; // seconds

export default function GameScreen({
  gameInstance,
  playerId,
  onGameEnd,
}: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(gameInstance.getState());
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardModalDesign, setCardModalDesign] = useState<CardDesignFull | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(TURN_TIME_LIMIT);
  
  // Determine which player is "us" and which is opponent
  const isPlayer1 = playerId === gameState.player1.id;
  const player = isPlayer1 ? gameState.player1 : gameState.player2;
  const opponent = isPlayer1 ? gameState.player2 : gameState.player1;
  const isMyTurn = gameState.activePlayerId === playerId;

  // Turn timer
  useEffect(() => {
    if (!isMyTurn) {
      setTurnTimeRemaining(TURN_TIME_LIMIT);
      return;
    }

    const interval = setInterval(() => {
      setTurnTimeRemaining((prev) => {
        if (prev <= 0) {
          // Auto-end turn on timeout
          gameInstance.endTurn(playerId);
          return TURN_TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, gameState.currentTurn, gameInstance, playerId]);

  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = gameInstance.subscribe((newState) => {
      setGameState(newState);
      
      if (newState.activePlayerId === playerId) {
        setTurnTimeRemaining(TURN_TIME_LIMIT);
      }
      
      if (newState.phase === 'ended' && onGameEnd) {
        onGameEnd(newState.winnerId!);
      }
    });
    
    return unsubscribe;
  }, [gameInstance, onGameEnd, playerId]);

  // Handlers
  const handlePlayCard = useCallback((cardId: string, position: number) => {
    if (!isMyTurn) return;
    gameInstance.playCard(playerId, cardId, position);
  }, [isMyTurn, playerId, gameInstance]);

  const handleSelectUnit = useCallback((unitId: string) => {
    if (!isMyTurn) return;
    
    if (selectedAttackerId === unitId) {
      setSelectedAttackerId(null);
    } else {
      setSelectedAttackerId(unitId);
    }
  }, [isMyTurn, selectedAttackerId]);

  const handleAttackTarget = useCallback((targetId: string) => {
    if (!selectedAttackerId || !isMyTurn) return;
    gameInstance.attack(playerId, selectedAttackerId, targetId);
    setSelectedAttackerId(null);
  }, [selectedAttackerId, isMyTurn, playerId, gameInstance]);

  const handleAttackFace = useCallback(() => {
    if (!selectedAttackerId || !isMyTurn) return;
    gameInstance.attack(playerId, selectedAttackerId, 'face');
    setSelectedAttackerId(null);
  }, [selectedAttackerId, isMyTurn, playerId, gameInstance]);

  const handleEndTurn = useCallback(() => {
    if (!isMyTurn) return;
    gameInstance.endTurn(playerId);
    setSelectedAttackerId(null);
  }, [isMyTurn, playerId, gameInstance]);

  const handleCardLongPress = useCallback((cardId: string) => {
    const handCard = player.hand.find(c => c.id === cardId);
    const boardUnit = player.board.find(u => u.id === cardId);
    const opponentUnit = opponent.board.find(u => u.id === cardId);
    const card = handCard || boardUnit || opponentUnit;
    if (card) {
      setCardModalDesign(card.design);
      setShowCardModal(true);
    }
  }, [player, opponent]);

  // Calculate valid attack targets
  const validTargets = selectedAttackerId 
    ? getValidAttackTargets(gameState, selectedAttackerId)
    : [];
  const canAttackFace = validTargets.includes('face');
  const validUnitTargets = validTargets.filter(t => t !== 'face');

  // Turn timer progress (0-1)
  const isTimerWarning = turnTimeRemaining <= 20;

  // Debug: Log hand state
  console.log('GameScreen - My hand size:', player.hand.length);
  console.log('GameScreen - Opponent hand size:', opponent.hand.length);
  console.log('GameScreen - Game phase:', gameState.phase);
  console.log('GameScreen - Is my turn:', isMyTurn);

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a1f', '#0a0a0f']}
        style={styles.background}
      >
        {/* Opponent's Side (Top 30%) */}
        <View style={styles.opponentZone}>
          <View style={styles.opponentScaled}>
            {/* Opponent Profile (Left) */}
            <View style={styles.opponentProfileLeft}>
              <PlayerProfile
                name={opponent.name}
                avatarUrl={opponent.avatarUrl}
                health={opponent.health}
                maxHealth={opponent.maxHealth}
                bandwidth={opponent.bandwidth}
                maxBandwidth={opponent.maxBandwidth}
                isActive={gameState.activePlayerId === opponent.id}
                isOpponent
                deckCount={opponent.deck.length}
                fatigueCount={opponent.fatigueCount}
                onPress={canAttackFace ? handleAttackFace : undefined}
              />
            </View>

            {/* Opponent's Hand (Hidden) */}
            <View style={styles.opponentHand}>
              <Hand
                cards={opponent.hand}
                bandwidth={opponent.bandwidth}
                isActive={false}
                isHidden
              />
            </View>
          </View>
        </View>

        {/* Central Board (Middle 40%) */}
        <View style={styles.boardZone}>
          <GameBoard
            playerBoard={isPlayer1 ? gameState.player1.board : gameState.player2.board}
            opponentBoard={isPlayer1 ? gameState.player2.board : gameState.player1.board}
            activePlayerId={gameState.activePlayerId}
            playerId={playerId}
            selectedAttackerId={selectedAttackerId}
            validAttackTargets={validUnitTargets}
            onSelectUnit={handleSelectUnit}
            onAttackTarget={handleAttackTarget}
            onAttackFace={handleAttackFace}
            canAttackFace={canAttackFace}
            onUnitLongPress={handleCardLongPress}
          />
        </View>

        {/* Central Divider (Glowing Neon Bar) */}
        <View style={styles.dividerZone}>
          <Animated.View style={styles.neonDivider}>
            <LinearGradient
              colors={['transparent', '#8b5cf6', '#a855f7', '#8b5cf6', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dividerGradient}
            />
          </Animated.View>
        </View>

        {/* Your Side (Bottom 30%) */}
        <View style={styles.playerZone}>
          {/* Your Profile (Left) */}
          <View style={styles.playerProfileLeft}>
            <PlayerProfile
              name={player.name}
              avatarUrl={player.avatarUrl}
              health={player.health}
              maxHealth={player.maxHealth}
              bandwidth={player.bandwidth}
              maxBandwidth={player.maxBandwidth}
              isActive={isMyTurn}
              deckCount={player.deck.length}
              fatigueCount={player.fatigueCount}
            />
          </View>

          {/* Your Hand (Fanned) */}
          <View style={styles.playerHand}>
            <Hand
              cards={player.hand}
              bandwidth={player.bandwidth}
              isActive={isMyTurn}
              onPlayCard={handlePlayCard}
              onCardLongPress={handleCardLongPress}
            />
          </View>
        </View>

        {/* Turn Timer (Above Active Player) */}
        {isMyTurn && (
          <View style={styles.timerContainer}>
            <Animated.View style={styles.timerCircle}>
              <Text style={[styles.timerText, isTimerWarning && styles.timerWarning]}>
                {turnTimeRemaining}s
              </Text>
            </Animated.View>
          </View>
        )}

        {/* End Turn Button (Bottom Right) */}
        <Pressable
          style={[styles.endTurnButton, !isMyTurn && styles.endTurnDisabled]}
          onPress={handleEndTurn}
          disabled={!isMyTurn}
        >
          <LinearGradient
            colors={isMyTurn ? ['#22c55e', '#16a34a'] : ['#475569', '#334155']}
            style={styles.endTurnGradient}
          >
            <Text style={styles.endTurnText}>
              {isMyTurn ? 'END TURN' : 'WAITING...'}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Deck Icon (Bottom Left) */}
        <View style={styles.deckIcon}>
          <Pressable style={styles.deckButton}>
            <Text style={styles.deckEmoji}>🃏</Text>
            <Text style={styles.deckCount}>{player.deck.length}</Text>
          </Pressable>
        </View>

        {/* Graveyard Icon (Top Right) */}
        <View style={styles.graveyardIcon}>
          <Pressable style={styles.graveyardButton}>
            <Text style={styles.graveyardEmoji}>💀</Text>
            <Text style={styles.graveyardCount}>{player.graveyard.length}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Card Details Modal */}
      <CardDetailModal
        visible={showCardModal}
        onClose={() => {
          setShowCardModal(false);
          setCardModalDesign(null);
        }}
        cardDesign={cardModalDesign as any}
        isGameMaster={false}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  opponentZone: {
    height: '30%',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  opponentScaled: {
    flex: 1,
    transform: [{ scale: 0.9 }],
  },
  opponentProfileLeft: {
    position: 'absolute',
    left: 8,
    top: 8,
    zIndex: 10,
  },
  opponentHand: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    height: 60,
  },
  boardZone: {
    height: '40%',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dividerZone: {
    height: '2%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  neonDivider: {
    width: '90%',
    height: 3,
    borderRadius: 2,
  },
  dividerGradient: {
    flex: 1,
    borderRadius: 2,
  },
  playerZone: {
    height: '30%',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  playerProfileLeft: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    zIndex: 10,
  },
  playerHand: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 120,
  },
  timerContainer: {
    position: 'absolute',
    top: '32%',
    right: 16,
    zIndex: 20,
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 3,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
  },
  timerWarning: {
    color: '#ef4444',
  },
  endTurnButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 20,
  },
  endTurnDisabled: {
    opacity: 0.5,
  },
  endTurnGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  endTurnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  deckIcon: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 20,
  },
  deckButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  deckEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  deckCount: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '700',
  },
  graveyardIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
  },
  graveyardButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6b7280',
  },
  graveyardEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  graveyardCount: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
});
