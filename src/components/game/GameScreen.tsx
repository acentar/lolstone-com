/**
 * Game Screen Component - Redesigned Gaming Board
 * 
 * 4:3 responsive canvas with:
 * - Opponent's side (top 30%, scaled 0.9x)
 * - Central Board (middle 40%, 7 slots/side)
 * - Your side (bottom 30%, scaled 1x)
 * - Bandwidth crystals, fanned hand, deck/graveyard
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GameState, GameInstance, getValidAttackTargets, canUnitAttack, UnitInPlay } from '../../game';
import PlayerProfile from './PlayerProfile';
import GameBoard from './GameBoard';
import Hand from './Hand';
import CardDetailModal from '../../components/CardDetailModal';

// Epic Attack Animation Component
function EpicAttackAnimation({
  attackerUnit,
  targetUnit,
  damageDealt,
  isLethal,
  phase,
  onComplete
}: {
  attackerUnit: any;
  targetUnit: any;
  damageDealt: number;
  isLethal: boolean;
  phase: string;
  onComplete: () => void;
}) {
  const [animationPhase, setAnimationPhase] = useState<'hover' | 'clash' | 'damage' | 'degrade' | 'reset'>('hover');
  const attackerScale = useSharedValue(1);
  const targetScale = useSharedValue(1);
  const attackerTranslateY = useSharedValue(0);
  const targetTranslateY = useSharedValue(0);
  const attackerGlow = useSharedValue(0);
  const targetShake = useSharedValue(0);
  const screenShake = useSharedValue(0);
  const vignetteOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase === 'hover') {
      // Phase 1: Pre-attack hover (0.2s)
      attackerGlow.value = withTiming(1, { duration: 200 });
      attackerScale.value = withTiming(1.2, { duration: 200 });
      attackerTranslateY.value = withTiming(-20, { duration: 200 });

      targetShake.value = withRepeat(withTiming(5, { duration: 50 }), 4, true);

      setTimeout(() => setAnimationPhase('clash'), 200);
    } else if (phase === 'clash') {
      // Phase 2: Scale-up clash (0.4s)
      attackerScale.value = withTiming(1.5, { duration: 200 });
      targetScale.value = withTiming(1.5, { duration: 200 });
      screenShake.value = withRepeat(withTiming(10, { duration: 50 }), 8, true);
      vignetteOpacity.value = withTiming(0.3, { duration: 200 });

      setTimeout(() => setAnimationPhase('damage'), 400);
    } else if (phase === 'damage') {
      // Phase 3: Damage reveal (0.5s)
      screenShake.value = withTiming(0, { duration: 100 });
      setTimeout(() => setAnimationPhase('degrade'), 500);
    } else if (phase === 'degrade') {
      // Phase 4: Degradation (0.3s)
      if (isLethal) {
        targetScale.value = withTiming(0.8, { duration: 150 });
      }
      setTimeout(() => setAnimationPhase('reset'), 300);
    } else if (phase === 'reset') {
      // Phase 5: Reset (0.2s)
      attackerScale.value = withTiming(1, { duration: 200 });
      targetScale.value = withTiming(1, { duration: 200 });
      attackerTranslateY.value = withTiming(0, { duration: 200 });
      targetTranslateY.value = withTiming(0, { duration: 200 });
      attackerGlow.value = withTiming(0, { duration: 200 });
      vignetteOpacity.value = withTiming(0, { duration: 200 });

      setTimeout(onComplete, 200);
    }
  }, [phase, animationPhase]);

  const attackerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: attackerScale.value },
      { translateY: attackerTranslateY.value },
    ],
    shadowOpacity: attackerGlow.value,
    shadowColor: '#ff00ff',
    shadowRadius: 20,
  }));

  const targetStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: targetScale.value },
      { translateX: targetShake.value },
    ],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenShake.value }],
  }));

  const vignetteStyle = useAnimatedStyle(() => ({
    opacity: vignetteOpacity.value,
  }));

  return (
    <Animated.View style={[screenStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
      {/* Vignette overlay */}
      <Animated.View style={[vignetteStyle, {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
      }]} />

      {/* Attacker glow effect */}
      <Animated.View style={[attackerStyle, {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#ff00ff',
        borderRadius: 8,
      }]} />

      {/* Target shake effect */}
      <Animated.View style={[targetStyle, {
        position: 'absolute',
      }]} />

      {/* Blood splatter effect */}
      {animationPhase === 'damage' && (
        <BloodSplatterEffect damageAmount={damageDealt} isLethal={isLethal} />
      )}

      {/* Damage number */}
      {animationPhase === 'damage' && (
        <DamageNumberEffect amount={damageDealt} />
      )}
    </Animated.View>
  );
}

// Card Draw Animation Component
function CardDrawAnimation({ cardCount }: { cardCount: number }) {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!showAnimation) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {/* Cards flying from deck to hand */}
      {Array.from({ length: Math.min(cardCount, 5) }).map((_, i) => (
        <Animated.View
          key={`draw-card-${i}`}
          entering={SlideInUp.duration(600).delay(i * 100).springify()}
          exiting={FadeOut.duration(400)}
          style={{
            position: 'absolute',
            right: 20 + (i * 15), // Start from deck area (right side)
            bottom: 120 + (i * 10),
            width: 60,
            height: 80,
            backgroundColor: '#1f2937',
            borderRadius: 6,
            borderWidth: 2,
            borderColor: '#fbbf24',
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 5,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              { rotate: `${-5 + Math.random() * 10}deg` }, // Slight random rotation
            ],
          }}
        >
          <Text style={{ fontSize: 24, color: '#fbbf24' }}>🃏</Text>
        </Animated.View>
      ))}

      {/* Draw text effect */}
      <Animated.View
        entering={ZoomIn.duration(400).springify()}
        exiting={FadeOut.duration(800)}
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          marginLeft: -75,
          backgroundColor: 'rgba(251, 191, 36, 0.9)',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 25,
          borderWidth: 3,
          borderColor: '#f59e0b',
        }}
      >
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center',
        }}>
          DRAW {cardCount} CARD{cardCount !== 1 ? 'S' : ''}! 🃏
        </Text>
      </Animated.View>

      {/* Sparkle effects */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Animated.View
          key={`sparkle-${i}`}
          entering={ZoomIn.duration(800).delay(i * 50).springify()}
          exiting={FadeOut.duration(600)}
          style={{
            position: 'absolute',
            left: Math.random() * 300 + 50,
            top: Math.random() * 200 + 100,
            width: 8,
            height: 8,
            backgroundColor: '#fbbf24',
            borderRadius: 4,
          }}
        />
      ))}
    </View>
  );
}

// Blood splatter physics component
function BloodSplatterEffect({ damageAmount, isLethal }: { damageAmount: number; isLethal: boolean }) {
  const [bloodDrops, setBloodDrops] = useState<Array<{
    id: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
  }>>([]);

  useEffect(() => {
    const drops = [];
    const numDrops = Math.min(damageAmount * 3, 20); // More damage = more blood

    for (let i = 0; i < numDrops; i++) {
      drops.push({
        id: `blood-${i}`,
        x: Math.random() * 300 - 150, // Spread around center
        y: Math.random() * 200 - 100,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 1.5,
      });
    }

    setBloodDrops(drops);

    // Clean up after animation
    setTimeout(() => setBloodDrops([]), 2000);
  }, [damageAmount, isLethal]);

  return (
    <View style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
      {bloodDrops.map((drop) => (
        <Animated.View
          key={drop.id}
          entering={SlideInDown.duration(300).springify()}
          exiting={FadeOut.duration(1000)}
          style={{
            position: 'absolute',
            left: drop.x,
            top: drop.y,
            transform: [
              { rotate: `${drop.rotation}deg` },
              { scale: drop.scale }
            ],
          }}
        >
          <Text style={{ fontSize: 24, color: '#dc2626' }}>
            {isLethal && Math.random() > 0.7 ? '💀' : '🩸'}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

// Explosive damage number component
function DamageNumberEffect({ amount }: { amount: number }) {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(3, { duration: 200 }),
      withTiming(2, { duration: 300 })
    );

    opacity.value = withDelay(500, withTiming(0, { duration: 300 }));
  }, [amount]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, {
      position: 'absolute',
      top: '40%',
      left: '50%',
      marginLeft: -50,
      alignItems: 'center',
    }]}>
      <Text style={{
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fbbf24',
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
      }}>
        -{amount}
      </Text>

      {/* Particle effects */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Animated.View
          key={i}
          entering={ZoomIn.duration(300).springify()}
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            backgroundColor: '#fbbf24',
            borderRadius: 2,
            left: Math.random() * 100 - 50,
            top: Math.random() * 100 - 50,
          }}
        />
      ))}
    </Animated.View>
  );
}

interface GameScreenProps {
  gameInstance: GameInstance;
  playerId: string;
  onGameEnd?: (winnerId: string) => void;
  onStateChange?: (newState: GameState) => Promise<boolean>;
}

const TURN_TIME_LIMIT = 75; // seconds

// Turn Banner Component - Shows dramatic turn transition
function TurnBanner({ isYourTurn, onComplete }: { isYourTurn: boolean; onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Auto-hide after 1.5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      // Call onComplete after fade animation
      setTimeout(onComplete, 300);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []); // Empty deps - only run once on mount

  if (!visible) {
    return null;
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(200)}
      style={styles.turnBannerOverlay}
    >
      <Pressable 
        style={styles.turnBannerOverlay} 
        onPress={() => {
          setVisible(false);
          setTimeout(onComplete, 100);
        }}
      >
        <Animated.View 
          entering={SlideInDown.duration(400).springify()}
          style={styles.turnBannerContainer}
        >
          <LinearGradient
            colors={isYourTurn ? ['#166534', '#22c55e', '#166534'] : ['#7f1d1d', '#ef4444', '#7f1d1d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.turnBannerGradient}
          >
            <Text style={styles.turnBannerText}>
              {isYourTurn ? '⚔️ YOUR TURN ⚔️' : '🛡️ OPPONENT\'S TURN 🛡️'}
            </Text>
            <Text style={styles.turnBannerSubtext}>
              {isYourTurn ? 'Make your move!' : 'Tap to continue'}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function GameScreen({
  gameInstance,
  playerId,
  onGameEnd,
  onStateChange,
}: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(gameInstance.getState());
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardModalDesign, setCardModalDesign] = useState<CardDesignFull | null>(null);
  const [cardModalUnit, setCardModalUnit] = useState<UnitInPlay | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(TURN_TIME_LIMIT);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [turnBannerIsYourTurn, setTurnBannerIsYourTurn] = useState(false);
  
  // Enhanced attack animation state - synced from game state
  const [attackAnimation, setAttackAnimation] = useState<{
    attackerId: string;
    targetId: string;
    damageDealt: number;
    attackerDamageTaken?: number;
    isLethal: boolean;
    phase: 'hover' | 'clash' | 'damage' | 'degrade' | 'reset';
    timestamp: number;
  } | null>(null);
  
  // Track last attack animation timestamp to detect new attacks
  const lastAttackTimestampRef = useRef<number>(0);

  // Track summoned units for animation
  const [summonedUnits, setSummonedUnits] = useState<Set<string>>(new Set());

  // Track cards drawn for animation
  const [cardsDrawn, setCardsDrawn] = useState<number>(0);
  
  // Graveyard viewing
  const [showGraveyard, setShowGraveyard] = useState<'player' | 'opponent' | null>(null);
  
  // Activity log
  const [showActivityLog, setShowActivityLog] = useState(false);
  
  // Game menu
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showConcedeConfirm, setShowConcedeConfirm] = useState(false);
  const [activityLog, setActivityLog] = useState<Array<{
    id: string;
    message: string;
    timestamp: number;
    type: 'attack' | 'play' | 'damage' | 'destroy' | 'turn' | 'effect';
  }>>([]);
  
  // Track previous turn to detect changes
  const prevTurnRef = useRef(gameState.currentTurn);
  const prevActivePlayerRef = useRef(gameState.activePlayerId);
  const prevPlayerBoardRef = useRef(gameState.player1.id === playerId ? gameState.player1.board : gameState.player2.board);
  const prevOpponentBoardRef = useRef(gameState.player1.id === playerId ? gameState.player2.board : gameState.player1.board);
  const prevPlayerHandSizeRef = useRef(gameState.player1.id === playerId ? gameState.player1.hand.length : gameState.player2.hand.length);
  const prevOpponentHandSizeRef = useRef(gameState.player1.id === playerId ? gameState.player2.hand.length : gameState.player1.hand.length);

  // Attack animation phase progression
  useEffect(() => {
    if (attackAnimation) {
      const phaseTimers = {
        hover: 200,
        clash: 400,
        damage: 500,
        degrade: 300,
        reset: 200,
      };

      const nextPhase = () => {
        setAttackAnimation(prev => {
          if (!prev) return null;

          const phases: Array<'hover' | 'clash' | 'damage' | 'degrade' | 'reset'> =
            ['hover', 'clash', 'damage', 'degrade', 'reset'];

          const currentIndex = phases.indexOf(prev.phase);
          const nextIndex = currentIndex + 1;

          if (nextIndex >= phases.length) {
            return null; // Animation complete
          }

          return {
            ...prev,
            phase: phases[nextIndex],
          };
        });
      };

      const timer = setTimeout(nextPhase, phaseTimers[attackAnimation.phase]);
      return () => clearTimeout(timer);
    }
  }, [attackAnimation?.phase]);
  
  // Add entry to activity log
  const addActivityLog = useCallback((message: string, type: 'attack' | 'play' | 'damage' | 'destroy' | 'turn' | 'effect') => {
    setActivityLog(prev => [{
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: Date.now(),
      type,
    }, ...prev].slice(0, 50)); // Keep last 50 entries
  }, []);
  
  // Detect and trigger attack animations from synced game state
  useEffect(() => {
    if (gameState.lastAttackAnimation) {
      const { attackerId, targetId, timestamp } = gameState.lastAttackAnimation;
      
      // Only trigger if this is a NEW attack (not one we've already shown)
      if (timestamp > lastAttackTimestampRef.current) {
        console.log('⚔️ Attack animation triggered:', attackerId, '->', targetId);
        lastAttackTimestampRef.current = timestamp;
        
        // Find attacker and target names for activity log
        const allUnits = [...gameState.player1.board, ...gameState.player2.board];
        const attacker = allUnits.find(u => u.id === attackerId);
        const target = allUnits.find(u => u.id === targetId);
        
        if (attacker) {
          const targetName = target ? target.design.name : 'Player';
          addActivityLog(`⚔️ ${attacker.design.name} attacks ${targetName}`, 'attack');
        }
        
        // Start the animation
        setAttackAnimation({
          attackerId,
          targetId,
          isActive: true,
        });
        
        // Clear animation after it completes
        setTimeout(() => {
          setAttackAnimation(null);
        }, 900); // Animation duration
      }
    }
  }, [gameState.lastAttackAnimation, gameState.player1.board, gameState.player2.board, addActivityLog]);
  
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
          console.log('⏰ Auto-ending turn on timeout');
          const newState = gameInstance.endTurn(playerId);
          if (onStateChange) {
            onStateChange(newState);
          }
          return TURN_TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, gameState.currentTurn, gameInstance, playerId, onStateChange]);

  // Update state when gameInstance changes (from sync)
  useEffect(() => {
    const currentState = gameInstance.getState();
    
    // Check if this is a new state we haven't seen
    if (currentState.activePlayerId !== prevActivePlayerRef.current) {
      console.log('🔄 GameScreen: Active player changed to:', currentState.activePlayerId);
      
      // Show turn banner
      setTurnBannerIsYourTurn(currentState.activePlayerId === playerId);
      setShowTurnBanner(true);
      
      prevActivePlayerRef.current = currentState.activePlayerId;
    }
    
    if (currentState.currentTurn !== prevTurnRef.current) {
      prevTurnRef.current = currentState.currentTurn;
    }
    
    // Detect newly summoned units for animation
    const currentPlayerBoard = currentState.player1.id === playerId ? currentState.player1.board : currentState.player2.board;
    const currentOpponentBoard = currentState.player1.id === playerId ? currentState.player2.board : currentState.player1.board;

    const prevPlayerBoard = prevPlayerBoardRef.current;
    const prevOpponentBoard = prevOpponentBoardRef.current;

    // Find new units that weren't in the previous state
    const newSummonedUnits = new Set<string>();

    // Check player board for new units
    for (const unit of currentPlayerBoard) {
      const wasInPrevBoard = prevPlayerBoard.some(prevUnit => prevUnit.id === unit.id);
      if (!wasInPrevBoard) {
        newSummonedUnits.add(unit.id);
        console.log('✨ New unit summoned on player board:', unit.design.name);
      }
    }

    // Check opponent board for new units
    for (const unit of currentOpponentBoard) {
      const wasInPrevBoard = prevOpponentBoard.some(prevUnit => prevUnit.id === unit.id);
      if (!wasInPrevBoard) {
        newSummonedUnits.add(unit.id);
        console.log('✨ New unit summoned on opponent board:', unit.design.name);
      }
    }

    if (newSummonedUnits.size > 0) {
      setSummonedUnits(prev => new Set([...prev, ...newSummonedUnits]));
      // Remove the summoning highlight after animation
      setTimeout(() => {
        setSummonedUnits(prev => {
          const updated = new Set(prev);
          newSummonedUnits.forEach(id => updated.delete(id));
          return updated;
        });
      }, 2000);
    }

    // Check for new attack animation
    if (currentState.lastAttackAnimation &&
        currentState.lastAttackAnimation.timestamp > lastAttackTimestampRef.current) {

      console.log('⚔️ Attack animation detected:', currentState.lastAttackAnimation);

      // Find the units involved to calculate damage
      const attacker = [...currentPlayerBoard, ...currentOpponentBoard]
        .find(unit => unit.id === currentState.lastAttackAnimation!.attackerId);
      const target = [...currentPlayerBoard, ...currentOpponentBoard]
        .find(unit => unit.id === currentState.lastAttackAnimation!.targetId);

      if (attacker && target) {
        // Calculate damage dealt (simplified - in reality this would be more complex)
        const damageDealt = Math.max(0, attacker.currentAttack - (target.currentAttack || 0));
        const isLethal = target.currentHealth - damageDealt <= 0;

        setAttackAnimation({
          attackerId: currentState.lastAttackAnimation!.attackerId,
          targetId: currentState.lastAttackAnimation!.targetId,
          damageDealt,
          isLethal,
          phase: 'hover',
          timestamp: currentState.lastAttackAnimation!.timestamp,
        });

        lastAttackTimestampRef.current = currentState.lastAttackAnimation.timestamp;
      }
    }

    // Detect cards drawn for animation
    const currentPlayerHandSize = currentState.player1.id === playerId ? currentState.player1.hand.length : currentState.player2.hand.length;
    const currentOpponentHandSize = currentState.player1.id === playerId ? currentState.player2.hand.length : currentState.player1.hand.length;

    const prevPlayerHandSize = prevPlayerHandSizeRef.current;
    const prevOpponentHandSize = prevOpponentHandSizeRef.current;

    // Check for cards drawn by player
    if (currentPlayerHandSize > prevPlayerHandSize) {
      const cardsDrawn = currentPlayerHandSize - prevPlayerHandSize;
      console.log('🃏 Player drew', cardsDrawn, 'card(s)');
      setCardsDrawn(cardsDrawn);

      // Clear animation after 2 seconds
      setTimeout(() => setCardsDrawn(0), 2000);
    }

    // Check for cards drawn by opponent
    if (currentOpponentHandSize > prevOpponentHandSize) {
      const cardsDrawn = currentOpponentHandSize - prevOpponentHandSize;
      console.log('🃏 Opponent drew', cardsDrawn, 'card(s)');
      // Note: We don't show opponent's draw animation for fairness
    }

    // Update previous hand size references
    prevPlayerHandSizeRef.current = currentPlayerHandSize;
    prevOpponentHandSizeRef.current = currentOpponentHandSize;

    // Update previous board references
    prevPlayerBoardRef.current = currentPlayerBoard;
    prevOpponentBoardRef.current = currentOpponentBoard;

    // Always update the state when gameInstance changes
    setGameState(currentState);

    if (currentState.activePlayerId === playerId) {
      setTurnTimeRemaining(TURN_TIME_LIMIT);
    }
  }, [gameInstance, playerId]);

  // Subscribe to game state changes from local actions
  useEffect(() => {
    const unsubscribe = gameInstance.subscribe((newState) => {
      console.log('📊 GameScreen: State update from subscription');
      
      // Check if active player changed (turn transition)
      if (newState.activePlayerId !== prevActivePlayerRef.current) {
        console.log('🔄 Turn changed! New active player:', newState.activePlayerId);
        
        // Show turn banner
        setTurnBannerIsYourTurn(newState.activePlayerId === playerId);
        setShowTurnBanner(true);
        
        // Activity log for turn change
        const isNowYourTurn = newState.activePlayerId === playerId;
        addActivityLog(
          isNowYourTurn ? `🔄 Turn ${newState.currentTurn} - Your turn!` : `🔄 Turn ${newState.currentTurn} - Opponent's turn`,
          'turn'
        );
        
        prevActivePlayerRef.current = newState.activePlayerId;
      }
      
      // Update previous turn tracking
      if (newState.currentTurn !== prevTurnRef.current) {
        prevTurnRef.current = newState.currentTurn;
      }
      
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
  const handlePlayCard = useCallback(async (cardId: string, position: number) => {
    if (!isMyTurn) return;
    
    // Find the card for activity log
    const card = player.hand.find(c => c.id === cardId);
    if (card) {
      addActivityLog(`🎴 You played ${card.design.name}`, 'play');
    }
    
    const newState = gameInstance.playCard(playerId, cardId, position);
    
    // Directly save to database
    if (onStateChange) {
      await onStateChange(newState);
    }
  }, [isMyTurn, playerId, gameInstance, player.hand, addActivityLog, onStateChange]);

  const handleSelectUnit = useCallback((unitId: string) => {
    if (!isMyTurn) return;
    
    if (selectedAttackerId === unitId) {
      setSelectedAttackerId(null);
    } else {
      setSelectedAttackerId(unitId);
    }
  }, [isMyTurn, selectedAttackerId]);

  const handleAttackTarget = useCallback(async (targetId: string) => {
    if (!selectedAttackerId || !isMyTurn) return;
    
    // Execute attack - animation will be triggered from synced game state
    // This ensures both players see the animation simultaneously
    const newState = gameInstance.attack(playerId, selectedAttackerId, targetId);
    setSelectedAttackerId(null);
    
    // Directly save to database
    if (onStateChange) {
      await onStateChange(newState);
    }
  }, [selectedAttackerId, isMyTurn, playerId, gameInstance, onStateChange]);

  const handleAttackFace = useCallback(async () => {
    if (!selectedAttackerId || !isMyTurn) return;
    
    // Execute attack - animation will be triggered from synced game state
    const newState = gameInstance.attack(playerId, selectedAttackerId, 'face');
    setSelectedAttackerId(null);
    
    // Directly save to database
    if (onStateChange) {
      await onStateChange(newState);
    }
  }, [selectedAttackerId, isMyTurn, playerId, gameInstance, onStateChange]);

  const handleEndTurn = useCallback(async () => {
    if (!isMyTurn) return;
    console.log('🎮 End Turn clicked!');
    const newState = gameInstance.endTurn(playerId);
    setSelectedAttackerId(null);
    
    // Directly save to database
    if (onStateChange) {
      console.log('📤 Directly saving end turn to database...');
      await onStateChange(newState);
    }
  }, [isMyTurn, playerId, gameInstance, onStateChange]);

  const handleConcede = useCallback(async () => {
    setShowConcedeConfirm(false);
    setShowGameMenu(false);
    const newState = gameInstance.concede(playerId);
    addActivityLog('🏳️ You surrendered the game', 'effect');
    
    if (onStateChange) {
      await onStateChange(newState);
    }
  }, [playerId, gameInstance, addActivityLog, onStateChange]);

  const handleCardLongPress = useCallback((cardId: string) => {
    const handCard = player.hand.find(c => c.id === cardId);
    const boardUnit = player.board.find(u => u.id === cardId);
    const opponentUnit = opponent.board.find(u => u.id === cardId);
    const card = handCard || boardUnit || opponentUnit;
    if (card) {
      setCardModalDesign(card.design);
      // If it's a unit on the board, pass the unit data for effect status
      const unitInPlay = boardUnit || opponentUnit;
      setCardModalUnit(unitInPlay || null);
      setShowCardModal(true);
    }
  }, [player, opponent]);

  // Double-tap also opens card details (same as long press)
  const handleCardDoubleTap = useCallback((cardId: string) => {
    handleCardLongPress(cardId);
  }, [handleCardLongPress]);

  // Calculate valid attack targets
  const validTargets = selectedAttackerId 
    ? getValidAttackTargets(gameState, selectedAttackerId)
    : [];
  const canAttackFace = validTargets.includes('face');
  const validUnitTargets = validTargets.filter(t => t !== 'face');

  // Check if player can do any meaningful action
  const canPlayerDoAnything = useCallback(() => {
    if (!isMyTurn) return false;
    
    // Check if player can play any card from hand
    const canPlayAnyCard = player.hand.some(card => card.design.mana_cost <= player.bandwidth);
    
    // Check if player has any units that can attack
    const canAttackWithAnyUnit = player.board.some(unit => canUnitAttack(gameState, unit.id));
    
    return canPlayAnyCard || canAttackWithAnyUnit;
  }, [isMyTurn, player.hand, player.bandwidth, player.board, gameState]);

  // Auto-end turn when player can't do anything meaningful
  useEffect(() => {
    if (!isMyTurn) return;
    
    // Small delay to let animations complete and avoid instant turn ending
    const timer = setTimeout(async () => {
      if (!canPlayerDoAnything()) {
        console.log('🤖 Auto-ending turn - no actions available');
        const newState = gameInstance.endTurn(playerId);
        if (onStateChange) {
          await onStateChange(newState);
        }
      }
    }, 1500); // 1.5 second delay
    
    return () => clearTimeout(timer);
  }, [gameState, isMyTurn, canPlayerDoAnything, gameInstance, playerId, onStateChange]);

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
            attackAnimation={attackAnimation}
            summonedUnits={summonedUnits}
            onSelectUnit={handleSelectUnit}
            onAttackTarget={handleAttackTarget}
            onAttackFace={handleAttackFace}
            canAttackFace={canAttackFace}
            onUnitLongPress={handleCardLongPress}
            onUnitDoubleTap={handleCardDoubleTap}
          />

          {/* Epic Attack Animation Overlay */}
          {attackAnimation && attackAnimation.phase !== 'reset' && (() => {
            const attacker = [...(isPlayer1 ? gameState.player1.board : gameState.player2.board),
                             ...(isPlayer1 ? gameState.player2.board : gameState.player1.board)]
              .find(unit => unit.id === attackAnimation.attackerId);
            const target = [...(isPlayer1 ? gameState.player1.board : gameState.player2.board),
                           ...(isPlayer1 ? gameState.player2.board : gameState.player1.board)]
              .find(unit => unit.id === attackAnimation.targetId);

            if (attacker && target) {
              return (
                <View style={StyleSheet.absoluteFill}>
                  <EpicAttackAnimation
                    attackerUnit={attacker}
                    targetUnit={target}
                    damageDealt={attackAnimation.damageDealt}
                    isLethal={attackAnimation.isLethal}
                    phase={attackAnimation.phase}
                    onComplete={() => setAttackAnimation(null)}
                  />
                </View>
              );
            }
            return null;
          })()}

          {/* Card Draw Animation Overlay */}
          {cardsDrawn > 0 && (
            <CardDrawAnimation cardCount={cardsDrawn} />
          )}
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
              onCardDoubleTap={handleCardDoubleTap}
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

        {/* Your Graveyard Icon (Bottom Left, above deck) */}
        <View style={styles.graveyardIcon}>
          <Pressable style={styles.graveyardButton} onPress={() => setShowGraveyard('player')}>
            <Text style={styles.graveyardEmoji}>💀</Text>
            <Text style={styles.graveyardCount}>{player.graveyard.length}</Text>
          </Pressable>
        </View>
        
        {/* Opponent Graveyard Icon (Top Left) */}
        <View style={styles.opponentGraveyardIcon}>
          <Pressable style={styles.graveyardButton} onPress={() => setShowGraveyard('opponent')}>
            <Text style={styles.graveyardEmoji}>💀</Text>
            <Text style={styles.graveyardCount}>{opponent.graveyard.length}</Text>
          </Pressable>
        </View>
        
        {/* Game Menu Button (Top Right) */}
        <View style={styles.gameMenuToggle}>
          <Pressable 
            style={styles.gameMenuButton} 
            onPress={() => setShowGameMenu(true)}
          >
            <Text style={styles.gameMenuIcon}>☰</Text>
          </Pressable>
        </View>
        
        {/* Activity Log Toggle (Top Right, below menu) */}
        <View style={styles.activityToggle}>
          <Pressable 
            style={[styles.activityButton, showActivityLog && styles.activityButtonActive]} 
            onPress={() => setShowActivityLog(!showActivityLog)}
          >
            <Text style={styles.activityIcon}>📋</Text>
          </Pressable>
        </View>
        
        {/* Activity Log Panel (Right Side) */}
        {showActivityLog && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.activityPanel}
          >
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Activity Log</Text>
              <Pressable onPress={() => setShowActivityLog(false)}>
                <Text style={styles.activityClose}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.activityList}>
              {activityLog.length === 0 ? (
                <Text style={styles.activityEmpty}>No activity yet...</Text>
              ) : (
                activityLog.slice(0, 20).map((entry) => (
                  <View key={entry.id} style={styles.activityEntry}>
                    <Text style={[
                      styles.activityMessage,
                      entry.type === 'attack' && styles.activityAttack,
                      entry.type === 'turn' && styles.activityTurn,
                      entry.type === 'destroy' && styles.activityDestroy,
                    ]}>
                      {entry.message}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </Animated.View>
        )}
        
        {/* Graveyard Modal */}
        {showGraveyard && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.graveyardOverlay}
          >
            <Pressable style={styles.graveyardBackdrop} onPress={() => setShowGraveyard(null)} />
            <View style={styles.graveyardModal}>
              <View style={styles.graveyardHeader}>
                <Text style={styles.graveyardTitle}>
                  {showGraveyard === 'player' ? '💀 Your Graveyard' : '💀 Opponent\'s Graveyard'}
                </Text>
                <Pressable onPress={() => setShowGraveyard(null)}>
                  <Text style={styles.graveyardCloseBtn}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.graveyardContent}>
                {(showGraveyard === 'player' ? player.graveyard : opponent.graveyard).length === 0 ? (
                  <Text style={styles.graveyardEmpty}>No cards in graveyard</Text>
                ) : (
                  <View style={styles.graveyardCards}>
                    {(showGraveyard === 'player' ? player.graveyard : opponent.graveyard).map((card, index) => (
                      <Pressable 
                        key={`${card.id}-${index}`}
                        style={styles.graveyardCard}
                        onPress={() => {
                          setCardModalDesign(card.design);
                          setShowCardModal(true);
                        }}
                      >
                        <LinearGradient
                          colors={['#1e293b', '#334155']}
                          style={styles.graveyardCardInner}
                        >
                          <Text style={styles.graveyardCardCost}>{card.design.mana_cost}</Text>
                          <Text style={styles.graveyardCardName} numberOfLines={2}>{card.design.name}</Text>
                          {card.design.base_attack !== null && (
                            <Text style={styles.graveyardCardStats}>
                              ⚔️{card.design.base_attack}/{card.design.base_health}❤️
                            </Text>
                          )}
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Game Menu Modal */}
        {showGameMenu && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.menuOverlay}
          >
            <Pressable style={styles.menuBackdrop} onPress={() => setShowGameMenu(false)} />
            <View style={styles.menuModal}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>⚙️ Game Menu</Text>
                <Pressable onPress={() => setShowGameMenu(false)}>
                  <Text style={styles.menuCloseBtn}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.menuContent}>
                <Pressable 
                  style={styles.menuOption}
                  onPress={() => setShowActivityLog(!showActivityLog)}
                >
                  <Text style={styles.menuOptionIcon}>📋</Text>
                  <Text style={styles.menuOptionText}>
                    {showActivityLog ? 'Hide Activity Log' : 'Show Activity Log'}
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={styles.menuOption}
                  onPress={() => {
                    setShowGameMenu(false);
                    setShowGraveyard('player');
                  }}
                >
                  <Text style={styles.menuOptionIcon}>💀</Text>
                  <Text style={styles.menuOptionText}>View Your Graveyard</Text>
                </Pressable>
                
                <Pressable 
                  style={styles.menuOption}
                  onPress={() => {
                    setShowGameMenu(false);
                    setShowGraveyard('opponent');
                  }}
                >
                  <Text style={styles.menuOptionIcon}>💀</Text>
                  <Text style={styles.menuOptionText}>View Opponent's Graveyard</Text>
                </Pressable>
                
                <View style={styles.menuDivider} />
                
                <Pressable 
                  style={[styles.menuOption, styles.menuOptionDanger]}
                  onPress={() => setShowConcedeConfirm(true)}
                >
                  <Text style={styles.menuOptionIcon}>🏳️</Text>
                  <Text style={[styles.menuOptionText, styles.menuOptionTextDanger]}>Concede Game</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Concede Confirmation Modal */}
        {showConcedeConfirm && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.confirmOverlay}
          >
            <View style={styles.confirmModal}>
              <Text style={styles.confirmTitle}>🏳️ Surrender?</Text>
              <Text style={styles.confirmText}>
                Are you sure you want to concede? Your opponent will win the match.
              </Text>
              <View style={styles.confirmButtons}>
                <Pressable 
                  style={styles.confirmCancel}
                  onPress={() => setShowConcedeConfirm(false)}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={styles.confirmDanger}
                  onPress={handleConcede}
                >
                  <Text style={styles.confirmDangerText}>Concede</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Turn Transition Banner */}
        {showTurnBanner && (
          <TurnBanner
            isYourTurn={turnBannerIsYourTurn}
            onComplete={() => setShowTurnBanner(false)}
          />
        )}

        {/* Card Detail Modal */}
        <CardDetailModal
          visible={showCardModal}
          onClose={() => setShowCardModal(false)}
          cardDesign={cardModalDesign}
          unitInPlay={cardModalUnit}
        />
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
    left: 16,
    top: 16,
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
    left: 16,
    bottom: 16,
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
    bottom: 100,
    left: 150,
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
    bottom: 100,
    left: 100,
    zIndex: 20,
  },
  opponentGraveyardIcon: {
    position: 'absolute',
    top: 20,
    left: 80,
    zIndex: 20,
  },
  graveyardButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6b7280',
    minWidth: 40,
  },
  graveyardEmoji: {
    fontSize: 14,
    marginBottom: 1,
  },
  graveyardCount: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
  
  // Game Menu Button Styles
  gameMenuToggle: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 25,
  },
  gameMenuButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    minWidth: 44,
    alignItems: 'center',
  },
  gameMenuIcon: {
    fontSize: 20,
    color: '#e2e8f0',
  },
  
  // Activity Log Styles
  activityToggle: {
    position: 'absolute',
    top: 70,
    right: 16,
    zIndex: 20,
  },
  activityButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: '#6b7280',
  },
  activityButtonActive: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  activityIcon: {
    fontSize: 20,
  },
  activityPanel: {
    position: 'absolute',
    top: 120,
    right: 8,
    bottom: 120,
    width: 220,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    zIndex: 50,
    overflow: 'hidden',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  activityTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  activityClose: {
    color: '#94a3b8',
    fontSize: 16,
    padding: 4,
  },
  activityList: {
    flex: 1,
    padding: 8,
  },
  activityEmpty: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  activityEntry: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityMessage: {
    color: '#94a3b8',
    fontSize: 11,
  },
  activityAttack: {
    color: '#ef4444',
  },
  activityTurn: {
    color: '#22c55e',
    fontWeight: '600',
  },
  activityDestroy: {
    color: '#f59e0b',
  },
  
  // Graveyard Modal Styles
  graveyardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graveyardBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  graveyardModal: {
    width: '80%',
    maxWidth: 400,
    maxHeight: '70%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#475569',
    overflow: 'hidden',
  },
  graveyardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f172a',
  },
  graveyardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  graveyardCloseBtn: {
    color: '#94a3b8',
    fontSize: 20,
    padding: 4,
  },
  graveyardContent: {
    padding: 16,
  },
  graveyardEmpty: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
  graveyardCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  graveyardCard: {
    width: 70,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    opacity: 0.8,
  },
  graveyardCardInner: {
    flex: 1,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
  },
  graveyardCardCost: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#3b82f6',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
  },
  graveyardCardName: {
    color: '#e2e8f0',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
  graveyardCardStats: {
    color: '#94a3b8',
    fontSize: 10,
  },
  
  // Game Menu Modal Styles
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  menuModal: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f172a',
  },
  menuTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  menuCloseBtn: {
    color: '#94a3b8',
    fontSize: 20,
    padding: 4,
  },
  menuContent: {
    padding: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuOptionText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
  },
  menuOptionDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  menuOptionTextDanger: {
    color: '#ef4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
    marginHorizontal: 8,
  },
  
  // Concede Confirmation Styles
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  confirmModal: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 24,
    alignItems: 'center',
  },
  confirmTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  confirmText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancel: {
    backgroundColor: '#334155',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmCancelText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmDanger: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmDangerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Turn Banner Styles
  turnBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  turnBannerContainer: {
    width: '90%',
    maxWidth: 400,
  },
  turnBannerGradient: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  turnBannerText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  turnBannerSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
  },
});
