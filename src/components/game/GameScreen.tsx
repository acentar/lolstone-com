/**
 * Game Screen Component
 * 
 * The main game interface that combines all game components:
 * - Player profiles (both players)
 * - Game board with units
 * - Card hands
 * - Action buttons (End Turn, Settings)
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Text, Button, Portal, Modal, IconButton } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import PlayerProfile from './PlayerProfile';
import GameBoard from './GameBoard';
import Hand from './Hand';
import {
  GameState,
  GameInstance,
  getActivePlayer,
  getInactivePlayer,
  getValidAttackTargets,
  canUnitAttack,
  createPlayCardAction,
  createAttackAction,
  createEndTurnAction,
  createConcedeAction,
  hasKeyword,
} from '../../game';

interface GameScreenProps {
  gameInstance: GameInstance;
  playerId: string; // The local player's ID
  onGameEnd?: (winnerId: string) => void;
}

export default function GameScreen({
  gameInstance,
  playerId,
  onGameEnd,
}: GameScreenProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  const [gameState, setGameState] = useState<GameState>(gameInstance.getState());
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showConcedeConfirm, setShowConcedeConfirm] = useState(false);

  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = gameInstance.subscribe((newState) => {
      setGameState(newState);
      
      // Check for game end
      if (newState.phase === 'ended' && onGameEnd) {
        onGameEnd(newState.winnerId!);
      }
    });
    
    return unsubscribe;
  }, [gameInstance, onGameEnd]);

  // Determine which player is "us" and which is opponent
  const isPlayer1 = playerId === gameState.player1.id;
  const player = isPlayer1 ? gameState.player1 : gameState.player2;
  const opponent = isPlayer1 ? gameState.player2 : gameState.player1;
  const isMyTurn = gameState.activePlayerId === playerId;

  // Calculate valid attack targets when a unit is selected
  const validTargets = selectedAttackerId 
    ? getValidAttackTargets(gameState, selectedAttackerId)
    : [];
  const canAttackFace = validTargets.includes('face');
  const validUnitTargets = validTargets.filter(t => t !== 'face');

  // Handlers
  const handlePlayCard = (cardId: string, position: number) => {
    if (!isMyTurn) return;
    
    const card = player.hand.find(c => c.id === cardId);
    if (!card) return;
    
    // Check if card requires targeting
    const needsTarget = card.design.effects.some(e => 
      e.trigger === 'on_play' && ['enemy_unit', 'friendly_unit', 'any_unit'].includes(e.target)
    );
    
    // For simplicity, play without target for now
    // In full implementation, would show target selection UI
    gameInstance.playCard(playerId, cardId, position);
  };

  const handleSelectUnit = (unitId: string) => {
    if (!isMyTurn) return;
    
    if (selectedAttackerId === unitId) {
      // Deselect
      setSelectedAttackerId(null);
    } else if (canUnitAttack(gameState, unitId)) {
      // Select for attack
      setSelectedAttackerId(unitId);
    }
  };

  const handleAttackTarget = (targetId: string) => {
    if (!selectedAttackerId || !isMyTurn) return;
    
    gameInstance.attack(playerId, selectedAttackerId, targetId);
    setSelectedAttackerId(null);
  };

  const handleAttackFace = () => {
    if (!selectedAttackerId || !isMyTurn) return;
    
    gameInstance.attack(playerId, selectedAttackerId, 'face');
    setSelectedAttackerId(null);
  };

  const handleEndTurn = () => {
    if (!isMyTurn) return;
    gameInstance.endTurn(playerId);
    setSelectedAttackerId(null);
  };

  const handleConcede = () => {
    gameInstance.concede(playerId);
    setShowConcedeConfirm(false);
    setShowMenu(false);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={styles.background}
      >
        {/* Opponent Profile (Top) */}
        <View style={styles.opponentSection}>
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
        <Hand
          cards={opponent.hand}
          bandwidth={opponent.bandwidth}
          isActive={false}
          isHidden
        />

        {/* Game Board */}
        <GameBoard
          playerBoard={player.board}
          opponentBoard={opponent.board}
          activePlayerId={gameState.activePlayerId}
          playerId={playerId}
          selectedAttackerId={selectedAttackerId}
          validAttackTargets={validUnitTargets}
          onSelectUnit={handleSelectUnit}
          onAttackTarget={handleAttackTarget}
          onAttackFace={handleAttackFace}
          canAttackFace={canAttackFace}
        />

        {/* Player's Hand */}
        <Hand
          cards={player.hand}
          bandwidth={player.bandwidth}
          isActive={isMyTurn}
          onPlayCard={handlePlayCard}
        />

        {/* Player Profile (Bottom) */}
        <View style={styles.playerSection}>
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Menu Button */}
          <IconButton
            icon="menu"
            mode="contained"
            containerColor="rgba(51, 65, 85, 0.8)"
            iconColor="#f8fafc"
            size={20}
            onPress={() => setShowMenu(true)}
          />

          {/* End Turn Button */}
          <Pressable
            style={[
              styles.endTurnButton,
              isMyTurn && styles.endTurnButtonActive,
            ]}
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

          {/* Cancel Attack */}
          {selectedAttackerId && (
            <IconButton
              icon="close"
              mode="contained"
              containerColor="rgba(239, 68, 68, 0.8)"
              iconColor="#fff"
              size={20}
              onPress={() => setSelectedAttackerId(null)}
            />
          )}
        </View>

        {/* Turn Announcement */}
        {gameState.currentTurn > 0 && (
          <View style={styles.turnAnnouncement}>
            <Text style={styles.turnNumber}>Turn {gameState.currentTurn}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Menu Modal */}
      <Portal>
        <Modal
          visible={showMenu}
          onDismiss={() => setShowMenu(false)}
          contentContainerStyle={styles.menuModal}
        >
          <Text style={styles.menuTitle}>Game Menu</Text>
          <Button
            mode="contained"
            style={styles.menuButton}
            onPress={() => setShowMenu(false)}
          >
            Resume Game
          </Button>
          <Button
            mode="outlined"
            style={styles.menuButton}
            onPress={() => {
              setShowMenu(false);
              setShowConcedeConfirm(true);
            }}
          >
            Concede
          </Button>
        </Modal>

        {/* Concede Confirmation */}
        <Modal
          visible={showConcedeConfirm}
          onDismiss={() => setShowConcedeConfirm(false)}
          contentContainerStyle={styles.menuModal}
        >
          <Text style={styles.menuTitle}>Concede Match?</Text>
          <Text style={styles.concedeWarning}>
            You will lose this game if you concede.
          </Text>
          <View style={styles.concedeButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowConcedeConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor="#ef4444"
              onPress={handleConcede}
            >
              Concede
            </Button>
          </View>
        </Modal>
      </Portal>
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
  opponentSection: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  playerSection: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  actionButtons: {
    position: 'absolute',
    right: 12,
    bottom: 150,
    alignItems: 'center',
    gap: 8,
  },
  endTurnButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  endTurnButtonActive: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  endTurnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  endTurnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
  },
  turnAnnouncement: {
    position: 'absolute',
    top: 60,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  turnNumber: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  menuModal: {
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 24,
    borderRadius: 12,
    gap: 16,
  },
  menuTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  menuButton: {
    marginVertical: 4,
  },
  concedeWarning: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 8,
  },
  concedeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
});

