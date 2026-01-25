import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, Pressable, useWindowDimensions, Linking } from 'react-native';
import { Text, IconButton, Divider, ActivityIndicator, Chip, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import {
  CardDesign, CardKeyword, CardEffect,
  KEYWORD_INFO, TRIGGER_INFO, ACTION_INFO, TARGET_INFO, TOKEN_TRIGGER_INFO, TokenTrigger,
} from '../types/database';
import { UnitInPlay } from '../game/types';
import CardPreview from './CardPreview';
import TokenPreview from './TokenPreview';
import DeleteConfirmModal from './DeleteConfirmModal';

interface OwnershipInfo {
  playerId: string;
  playerName: string;
  count: number;
}

interface CardDetailModalProps {
  visible: boolean;
  onClose: () => void;
  cardDesign: CardDesign | null;
  unitInPlay?: UnitInPlay | null; // For showing effect status in-game
  isGameMaster?: boolean;
  onEdit?: (card: CardDesign) => void;
  onDelete?: (cardId: string) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#71717a',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export default function CardDetailModal({
  visible,
  onClose,
  cardDesign,
  unitInPlay,
  isGameMaster = false,
  onEdit,
  onDelete,
}: CardDetailModalProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 900;
  
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<CardKeyword[]>([]);
  const [effects, setEffects] = useState<CardEffect[]>([]);
  const [ownership, setOwnership] = useState<OwnershipInfo[]>([]);
  const [supplyInfo, setSupplyInfo] = useState<{ minted: number; supply: number | null; inCirculation: number }>({
    minted: 0,
    supply: null,
    inCirculation: 0,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = () => {
    if (cardDesign && onEdit) {
      onEdit(cardDesign);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!cardDesign || !onDelete) return;
    
    setDeleting(true);
    try {
      // Get all card instances for this design
      const { data: instances } = await supabase
        .from('card_instances')
        .select('id')
        .eq('design_id', cardDesign.id);
      
      if (instances && instances.length > 0) {
        const instanceIds = instances.map(i => i.id);
        
        // Delete deck_cards that reference these instances
        await supabase
          .from('deck_cards')
          .delete()
          .in('card_instance_id', instanceIds);
        
        // Delete the card instances
        await supabase
          .from('card_instances')
          .delete()
          .eq('design_id', cardDesign.id);
      }
      
      // Delete related design data
      await supabase.from('card_keywords').delete().eq('card_design_id', cardDesign.id);
      await supabase.from('card_effects').delete().eq('card_design_id', cardDesign.id);
      
      // Delete the card design
      const { error } = await supabase
        .from('card_designs')
        .delete()
        .eq('id', cardDesign.id);
      
      if (error) throw error;
      
      setShowDeleteModal(false);
      onDelete(cardDesign.id);
      onClose();
    } catch (error) {
      console.error('Error deleting card:', error);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (visible && cardDesign) {
      loadCardDetails();
    }
  }, [visible, cardDesign?.id]);

  const loadCardDetails = async () => {
    if (!cardDesign) return;
    
    setLoading(true);
    try {
      // Load keywords
      const { data: keywordsData } = await supabase
        .from('card_keywords')
        .select('keyword')
        .eq('card_design_id', cardDesign.id);
      
      if (keywordsData) {
        setKeywords(keywordsData.map(k => k.keyword));
      }

      // Load effects
      const { data: effectsData } = await supabase
        .from('card_effects')
        .select('*')
        .eq('card_design_id', cardDesign.id)
        .order('priority');
      
      if (effectsData) {
        setEffects(effectsData);
      }

      // Load ownership info
      const { data: instancesData } = await supabase
        .from('card_instances')
        .select(`
          id,
          owner_id,
          players!inner (
            id,
            name
          )
        `)
        .eq('design_id', cardDesign.id)
        .not('owner_id', 'is', null);

      if (instancesData) {
        // Group by owner
        const ownerMap = new Map<string, OwnershipInfo>();
        instancesData.forEach((instance: any) => {
          const ownerId = instance.owner_id;
          const existing = ownerMap.get(ownerId);
          if (existing) {
            existing.count++;
          } else {
            ownerMap.set(ownerId, {
              playerId: ownerId,
              playerName: instance.players?.name || 'Unknown',
              count: 1,
            });
          }
        });
        setOwnership(Array.from(ownerMap.values()).sort((a, b) => b.count - a.count));
      }

      // Load supply info
      const { data: allInstances } = await supabase
        .from('card_instances')
        .select('id, owner_id')
        .eq('design_id', cardDesign.id);

      if (allInstances) {
        const inCirculation = allInstances.filter(i => i.owner_id !== null).length;
        setSupplyInfo({
          minted: cardDesign.total_minted,
          supply: cardDesign.max_supply,
          inCirculation,
        });
      }
    } catch (error) {
      console.error('Error loading card details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!cardDesign) return null;

  const rarityColor = RARITY_COLORS[cardDesign.rarity] || '#71717a';

  // Render the card preview section (used in both layouts)
  const renderCardPreview = () => (
    <View style={[styles.previewSection, isDesktop && styles.previewSectionDesktop]}>
      <CardPreview
        name={cardDesign.name}
        manaCost={cardDesign.mana_cost}
        attack={cardDesign.attack ?? undefined}
        health={cardDesign.health ?? undefined}
        rarity={cardDesign.rarity}
        category={cardDesign.category}
        abilityText={cardDesign.ability_text ?? undefined}
        flavorText={cardDesign.flavor_text ?? undefined}
        keywords={keywords}
        imageUrl={cardDesign.image_url ?? undefined}
        cardType={cardDesign.card_type}
        scale={isDesktop ? 1.3 : 0.9}
        showCollectibleInfo={false}
      />
      
      {/* Token Preview */}
      {cardDesign.has_token && cardDesign.token_name && (
        <View style={styles.tokenSection}>
          <Text style={styles.tokenLabel}>👻 Token</Text>
          <TokenPreview
            name={cardDesign.token_name}
            attack={cardDesign.token_attack}
            health={cardDesign.token_health}
            imageUrl={cardDesign.token_image_url ?? undefined}
            scale={isDesktop ? 0.9 : 0.7}
          />
          <Text style={styles.tokenInfo}>
            {(cardDesign.token_trigger === 'on_play' || cardDesign.token_trigger === 'on_destroy')
              ? `Summons ${cardDesign.token_count} on ${(cardDesign.token_trigger as string).replace('_', ' ')}`
              : `Summons on ${(cardDesign.token_trigger as string).replace('_', ' ')} (max ${cardDesign.token_max_summons}×)`
            }
          </Text>
        </View>
      )}

      {/* Effect Status (for units in play) */}
      {unitInPlay && (
        <View style={styles.effectStatusSection}>
          <Text style={styles.effectStatusTitle}>⚡ Current Effects</Text>
          <View style={styles.effectStatusList}>
            {unitInPlay.isSilenced && (
              <View style={styles.effectStatusItem}>
                <Text style={styles.effectStatusIcon}>🤫</Text>
                <Text style={styles.effectStatusText}>Silenced - Keywords and effects disabled</Text>
              </View>
            )}
            {unitInPlay.isStunned && (
              <View style={styles.effectStatusItem}>
                <Text style={styles.effectStatusIcon}>😵</Text>
                <Text style={styles.effectStatusText}>Stunned - Cannot attack next turn</Text>
              </View>
            )}
            {unitInPlay.attackBuff > 0 && (
              <View style={styles.effectStatusItem}>
                <Text style={styles.effectStatusIcon}>⚔️</Text>
                <Text style={styles.effectStatusText}>Attack Buff: +{unitInPlay.attackBuff}</Text>
              </View>
            )}
            {unitInPlay.healthBuff > 0 && (
              <View style={styles.effectStatusItem}>
                <Text style={styles.effectStatusIcon}>🛡️</Text>
                <Text style={styles.effectStatusText}>Health Buff: +{unitInPlay.healthBuff}</Text>
              </View>
            )}
            {!unitInPlay.canAttack && (
              <View style={styles.effectStatusItem}>
                <Text style={styles.effectStatusIcon}>😴</Text>
                <Text style={styles.effectStatusText}>Cannot attack this turn</Text>
              </View>
            )}
            {!unitInPlay.isSilenced && !unitInPlay.isStunned && unitInPlay.attackBuff === 0 && unitInPlay.healthBuff === 0 && unitInPlay.canAttack && (
              <Text style={styles.noEffectsText}>No active effects</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );

  // Render the content/details section
  const renderContent = () => (
    <ScrollView 
      style={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]} 
      showsVerticalScrollIndicator={false}
    >
      {/* Stats Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cardDesign.mana_cost}</Text>
            <Text style={styles.statLabel}>Cost</Text>
          </View>
          {cardDesign.category === 'unit' && (
            <>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#ef4444' }]}>{cardDesign.attack ?? 0}</Text>
                <Text style={styles.statLabel}>Attack</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>{cardDesign.health ?? 0}</Text>
                <Text style={styles.statLabel}>Health</Text>
              </View>
            </>
          )}
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: rarityColor }]}>
              {cardDesign.rarity.charAt(0).toUpperCase()}
            </Text>
            <Text style={styles.statLabel}>{cardDesign.rarity}</Text>
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Keywords */}
      {keywords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keywords</Text>
          <View style={styles.keywordsRow}>
            {keywords.map((kw) => (
              <View key={kw} style={styles.keywordItem}>
                <Text style={styles.keywordIcon}>{KEYWORD_INFO[kw].icon}</Text>
                <View>
                  <Text style={styles.keywordName}>{KEYWORD_INFO[kw].name}</Text>
                  <Text style={styles.keywordDesc}>{KEYWORD_INFO[kw].description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Effects */}
      {effects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Effects</Text>
          {effects.map((effect, index) => (
            <View key={index} style={styles.effectItem}>
              <View style={styles.effectHeader}>
                <Text style={styles.effectTrigger}>
                  {TRIGGER_INFO[effect.trigger]?.icon} {TRIGGER_INFO[effect.trigger]?.name}
                </Text>
              </View>
              <Text style={styles.effectDetail}>
                {ACTION_INFO[effect.action]?.icon} {ACTION_INFO[effect.action]?.name} ({effect.value}) → {TARGET_INFO[effect.target]?.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Divider style={styles.divider} />

      {/* Supply Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supply & Distribution</Text>
        <View style={styles.supplyGrid}>
          <View style={styles.supplyItem}>
            <Text style={styles.supplyValue}>{supplyInfo.minted}</Text>
            <Text style={styles.supplyLabel}>Total Minted</Text>
          </View>
          <View style={styles.supplyItem}>
            <Text style={styles.supplyValue}>
              {supplyInfo.supply !== null ? supplyInfo.supply : '∞'}
            </Text>
            <Text style={styles.supplyLabel}>Max Supply</Text>
          </View>
          <View style={styles.supplyItem}>
            <Text style={styles.supplyValue}>{supplyInfo.inCirculation}</Text>
            <Text style={styles.supplyLabel}>In Circulation</Text>
          </View>
          <View style={styles.supplyItem}>
            <Text style={styles.supplyValue}>
              {supplyInfo.supply !== null 
                ? supplyInfo.supply - supplyInfo.minted 
                : '∞'}
            </Text>
            <Text style={styles.supplyLabel}>Available to Mint</Text>
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Ownership */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Owners</Text>
        {ownership.length === 0 ? (
          <Text style={styles.emptyText}>No one owns this card yet</Text>
        ) : (
          <View style={styles.ownersList}>
            {ownership.slice(0, 10).map((owner, index) => (
              <View key={owner.playerId} style={styles.ownerItem}>
                <View style={styles.ownerRank}>
                  <Text style={styles.ownerRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.ownerName}>{owner.playerName}</Text>
                <Chip compact style={styles.ownerCount}>
                  {owner.count}x
                </Chip>
              </View>
            ))}
            {ownership.length > 10 && (
              <Text style={styles.moreOwnersText}>
                +{ownership.length - 10} more owners
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Inspiration */}
      {cardDesign.inspiration && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspiration</Text>
            <View style={styles.inspirationBox}>
              <Text style={styles.inspirationText}>
                {cardDesign.inspiration}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Balance Notes */}
      {cardDesign.balance_notes && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Balance Note</Text>
            <View style={styles.balanceNotesBox}>
              <Text style={styles.balanceNotesText}>
                {cardDesign.balance_notes}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Info</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Card ID</Text>
          <Text style={styles.metaValue}>{cardDesign.id.slice(0, 8)}...</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Category</Text>
          <Text style={styles.metaValue}>
            {cardDesign.category === 'unit' ? '⚔️ Unit' : '✦ Action'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Type</Text>
          <Text style={styles.metaValue}>{cardDesign.card_type.replace('_', ' ')}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Created</Text>
          <Text style={styles.metaValue}>
            {new Date(cardDesign.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status</Text>
          <Text style={[
            styles.metaValue, 
            { color: cardDesign.is_active ? '#22c55e' : '#ef4444' }
          ]}>
            {cardDesign.is_active ? '✓ Active' : '✗ Inactive'}
          </Text>
        </View>
      </View>

      {/* Public Page Link */}
      {cardDesign && (
        <View style={styles.publicLinkSection}>
          <Pressable
            onPress={() => {
              onClose();
              router.push(`/card/${cardDesign.id}`);
            }}
            style={styles.publicLinkButton}
          >
            <Text style={styles.publicLinkText}>View Public Page</Text>
            <Text style={styles.publicLinkIcon}>→</Text>
          </Pressable>
        </View>
      )}

      {/* Action Buttons (GM only) */}
      {isGameMaster && (onEdit || onDelete) && (
        <View style={styles.actionButtonsSection}>
          <Divider style={styles.divider} />
          <View style={styles.actionButtons}>
            {onEdit && (
              <Button
                mode="outlined"
                onPress={handleEdit}
                icon="pencil"
                style={styles.editButton}
                textColor="#3b82f6"
              >
                Edit Design
              </Button>
            )}
            {onDelete && (
              <Button
                mode="outlined"
                onPress={() => setShowDeleteModal(true)}
                icon="delete"
                style={styles.deleteButton}
                textColor="#ef4444"
              >
                Delete
              </Button>
            )}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={[styles.modalContainer, isDesktop && styles.modalContainerDesktop]}>
          <LinearGradient
            colors={['#1e1e2e', '#12121a']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
                <Text style={styles.headerTitle}>{cardDesign.name}</Text>
              </View>
              <IconButton
                icon="close"
                iconColor="#94a3b8"
                size={24}
                onPress={onClose}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={rarityColor} size="large" />
              </View>
            ) : isDesktop ? (
              /* Desktop: Split layout */
              <View style={styles.desktopLayout}>
                <View style={styles.desktopCardPanel}>
                  {renderCardPreview()}
                </View>
                <View style={styles.desktopContentPanel}>
                  {renderContent()}
                </View>
              </View>
            ) : (
              /* Mobile: Stacked layout with card preview and content in one scroll */
              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderCardPreview()}
                
                {/* Stats Summary */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Card Stats</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{cardDesign.mana_cost}</Text>
                      <Text style={styles.statLabel}>Cost</Text>
                    </View>
                    {cardDesign.category === 'unit' && (
                      <>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: '#ef4444' }]}>{cardDesign.attack ?? 0}</Text>
                          <Text style={styles.statLabel}>Attack</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: '#22c55e' }]}>{cardDesign.health ?? 0}</Text>
                          <Text style={styles.statLabel}>Health</Text>
                        </View>
                      </>
                    )}
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: rarityColor }]}>
                        {cardDesign.rarity.charAt(0).toUpperCase()}
                      </Text>
                      <Text style={styles.statLabel}>{cardDesign.rarity}</Text>
                    </View>
                  </View>
                </View>

                <Divider style={styles.divider} />

                {/* Keywords */}
                {keywords.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Keywords</Text>
                    <View style={styles.keywordsRow}>
                      {keywords.map((kw) => (
                        <View key={kw} style={styles.keywordItem}>
                          <Text style={styles.keywordIcon}>{KEYWORD_INFO[kw].icon}</Text>
                          <View>
                            <Text style={styles.keywordName}>{KEYWORD_INFO[kw].name}</Text>
                            <Text style={styles.keywordDesc}>{KEYWORD_INFO[kw].description}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Effects */}
                {effects.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Effects</Text>
                    {effects.map((effect, index) => (
                      <View key={index} style={styles.effectItem}>
                        <View style={styles.effectHeader}>
                          <Text style={styles.effectTrigger}>
                            {TRIGGER_INFO[effect.trigger]?.icon} {TRIGGER_INFO[effect.trigger]?.name}
                          </Text>
                        </View>
                        <Text style={styles.effectDetail}>
                          {ACTION_INFO[effect.action]?.icon} {ACTION_INFO[effect.action]?.name} ({effect.value}) → {TARGET_INFO[effect.target]?.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Divider style={styles.divider} />

                {/* Supply Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Supply & Distribution</Text>
                  <View style={styles.supplyGrid}>
                    <View style={styles.supplyItem}>
                      <Text style={styles.supplyValue}>{supplyInfo.minted}</Text>
                      <Text style={styles.supplyLabel}>Total Minted</Text>
                    </View>
                    <View style={styles.supplyItem}>
                      <Text style={styles.supplyValue}>
                        {supplyInfo.supply !== null ? supplyInfo.supply : '∞'}
                      </Text>
                      <Text style={styles.supplyLabel}>Max Supply</Text>
                    </View>
                    <View style={styles.supplyItem}>
                      <Text style={styles.supplyValue}>{supplyInfo.inCirculation}</Text>
                      <Text style={styles.supplyLabel}>In Circulation</Text>
                    </View>
                    <View style={styles.supplyItem}>
                      <Text style={styles.supplyValue}>
                        {supplyInfo.supply !== null 
                          ? supplyInfo.supply - supplyInfo.minted 
                          : '∞'}
                      </Text>
                      <Text style={styles.supplyLabel}>Available to Mint</Text>
                    </View>
                  </View>
                </View>

                <Divider style={styles.divider} />

                {/* Ownership */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Current Owners</Text>
                  {ownership.length === 0 ? (
                    <Text style={styles.emptyText}>No one owns this card yet</Text>
                  ) : (
                    <View style={styles.ownersList}>
                      {ownership.slice(0, 10).map((owner, index) => (
                        <View key={owner.playerId} style={styles.ownerItem}>
                          <View style={styles.ownerRank}>
                            <Text style={styles.ownerRankText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.ownerName}>{owner.playerName}</Text>
                          <Chip compact style={styles.ownerCount}>
                            {owner.count}x
                          </Chip>
                        </View>
                      ))}
                      {ownership.length > 10 && (
                        <Text style={styles.moreOwnersText}>
                          +{ownership.length - 10} more owners
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Inspiration */}
                {cardDesign.inspiration && (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Inspiration</Text>
                      <View style={styles.inspirationBox}>
                        <Text style={styles.inspirationText}>
                          {cardDesign.inspiration}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Balance Notes */}
                {cardDesign.balance_notes && (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Balance Note</Text>
                      <View style={styles.balanceNotesBox}>
                        <Text style={styles.balanceNotesText}>
                          {cardDesign.balance_notes}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Metadata */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Card Info</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Card ID</Text>
                    <Text style={styles.metaValue}>{cardDesign.id.slice(0, 8)}...</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Category</Text>
                    <Text style={styles.metaValue}>
                      {cardDesign.category === 'unit' ? '⚔️ Unit' : '✦ Action'}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Type</Text>
                    <Text style={styles.metaValue}>{cardDesign.card_type.replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Created</Text>
                    <Text style={styles.metaValue}>
                      {new Date(cardDesign.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Status</Text>
                    <Text style={[
                      styles.metaValue, 
                      { color: cardDesign.is_active ? '#22c55e' : '#ef4444' }
                    ]}>
                      {cardDesign.is_active ? '✓ Active' : '✗ Inactive'}
                    </Text>
                  </View>
                </View>

                {/* Public Page Link */}
                {cardDesign && (
                  <View style={styles.publicLinkSection}>
                    <Pressable
                      onPress={() => {
                        onClose();
                        router.push(`/card/${cardDesign.id}`);
                      }}
                      style={styles.publicLinkButton}
                    >
                      <Text style={styles.publicLinkText}>View Public Page</Text>
                      <Text style={styles.publicLinkIcon}>→</Text>
                    </Pressable>
                  </View>
                )}

                {/* Action Buttons (GM only) */}
                {isGameMaster && (onEdit || onDelete) && (
                  <View style={styles.actionButtonsSection}>
                    <Divider style={styles.divider} />
                    <View style={styles.actionButtons}>
                      {onEdit && (
                        <Button
                          mode="outlined"
                          onPress={handleEdit}
                          icon="pencil"
                          style={styles.editButton}
                          textColor="#3b82f6"
                        >
                          Edit Design
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          mode="outlined"
                          onPress={() => setShowDeleteModal(true)}
                          icon="delete"
                          style={styles.deleteButton}
                          textColor="#ef4444"
                        >
                          Delete
                        </Button>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.bottomPadding} />
              </ScrollView>
            )}
          </LinearGradient>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={cardDesign?.name || ''}
        itemType="Card Design"
        loading={deleting}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContainerDesktop: {
    maxWidth: 950,
    width: '85%',
    maxHeight: '90%',
  },
  modalContent: {
    flex: 1,
  },
  
  // Desktop layout
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopCardPanel: {
    width: 380,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  desktopContentPanel: {
    flex: 1,
  },
  scrollContentDesktop: {
    flex: 1,
  },
  previewSectionDesktop: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  
  // Token section
  tokenSection: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a78bfa',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tokenInfo: {
    fontSize: 11,
    color: '#8b5cf6',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  scrollContent: {
    flex: 1,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  keywordsRow: {
    gap: 8,
  },
  keywordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  keywordIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  keywordName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  keywordDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
  effectItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  effectHeader: {
    marginBottom: 4,
  },
  effectTrigger: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a855f7',
  },
  effectDetail: {
    fontSize: 13,
    color: '#e2e8f0',
  },
  supplyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  supplyItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  supplyValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  supplyLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  ownersList: {
    gap: 8,
  },
  ownerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
  ownerRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  ownerRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  ownerName: {
    flex: 1,
    fontSize: 14,
    color: '#e2e8f0',
  },
  ownerCount: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  moreOwnersText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  inspirationBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },
  inspirationText: {
    fontSize: 13,
    color: '#c4b5fd',
    lineHeight: 20,
  },
  balanceNotesBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#64748b',
  },
  balanceNotesText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  metaValue: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 24,
  },
  actionButtonsSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    borderColor: '#3b82f6',
  },
  deleteButton: {
    flex: 1,
    borderColor: '#ef4444',
  },
  publicLinkSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  publicLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publicLinkText: {
    fontSize: 13,
    color: '#60a5fa',
    fontWeight: '500',
  },
  publicLinkIcon: {
    fontSize: 16,
    color: '#60a5fa',
  },

  // Effect Status Styles
  effectStatusSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  effectStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  effectStatusList: {
    gap: 8,
  },
  effectStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
  },
  effectStatusIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  effectStatusText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
  },
  noEffectsText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
});

