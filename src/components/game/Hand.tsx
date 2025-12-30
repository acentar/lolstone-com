/**
 * Hand Component
 * 
 * Displays the player's hand of cards in a fan layout
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CardInHand from './CardInHand';
import { CardInHand as CardInHandType } from '../../game/types';

interface HandProps {
  cards: CardInHandType[];
  bandwidth: number;
  isActive: boolean;
  onPlayCard?: (cardId: string, position: number) => void;
  isHidden?: boolean; // For opponent's hand
}

export default function Hand({
  cards,
  bandwidth,
  isActive,
  onPlayCard,
  isHidden = false,
}: HandProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSelect = (cardId: string) => {
    setSelectedCardId(prev => prev === cardId ? null : cardId);
  };

  const handlePlay = (cardId: string, position: number) => {
    if (onPlayCard) {
      onPlayCard(cardId, position);
      setSelectedCardId(null);
    }
  };

  if (isHidden) {
    // Show card backs for opponent
    return (
      <View style={styles.container}>
        <View style={styles.hiddenHand}>
          {cards.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.cardBack,
                { marginLeft: index > 0 ? -20 : 0 },
              ]}
            >
              <Text style={styles.cardBackText}>🎴</Text>
            </View>
          ))}
        </View>
        <Text style={styles.cardCount}>{cards.length} cards</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.handContainer}>
        {cards.map((card, index) => (
          <CardInHand
            key={card.id}
            card={card}
            index={index}
            totalCards={cards.length}
            canPlay={isActive && card.design.mana_cost <= bandwidth}
            isSelected={selectedCardId === card.id}
            onSelect={() => handleSelect(card.id)}
            onPlay={(position) => handlePlay(card.id, position)}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          />
        ))}
      </View>
      
      {/* Drag hint */}
      {isDragging && (
        <View style={styles.dragHint}>
          <Text style={styles.dragHintText}>↑ Drag up to play</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 40,
    minHeight: 120,
  },
  hiddenHand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBack: {
    width: 50,
    height: 70,
    backgroundColor: '#1e3a5f',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackText: {
    fontSize: 24,
  },
  cardCount: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  dragHint: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dragHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

