// Generated types for Supabase database
// These match the schema in supabase/schema.sql

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CardType = 'meme_minion' | 'viral_spell' | 'troll_legendary' | 'reaction_trap' | 'copypasta_enchantment';
export type TransactionType = 'mint' | 'grant_ducats' | 'purchase' | 'reward' | 'trade';

// Game mechanics types
export type CardCategory = 'unit' | 'action';

export type CardKeyword = 'frontline' | 'quick' | 'evasion' | 'boost';

export type TokenTrigger = 'on_play' | 'on_destroy' | 'on_attack' | 'on_damaged';

export type EffectTrigger = 
  | 'on_play' 
  | 'on_destroy' 
  | 'on_attack' 
  | 'on_damaged' 
  | 'end_of_turn' 
  | 'start_of_turn';

export type EffectTarget = 
  | 'self' 
  | 'friendly_unit' 
  | 'enemy_unit' 
  | 'any_unit' 
  | 'friendly_player' 
  | 'enemy_player' 
  | 'all_friendly' 
  | 'all_enemies' 
  | 'all_units' 
  | 'random_enemy' 
  | 'random_friendly';

export type EffectAction =
  | 'damage'
  | 'heal'
  | 'draw'
  | 'buff_attack'
  | 'buff_health'
  | 'destroy'
  | 'summon'
  | 'silence'
  | 'return_hand'
  | 'copy'
  | 'stun';

// Info objects for UI display

export interface Database {
  public: {
    Tables: {
      game_masters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          username: string;
          email: string | null;
          avatar_url: string | null;
          ducats: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          username: string;
          email?: string | null;
          avatar_url?: string | null;
          ducats?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          username?: string;
          email?: string | null;
          avatar_url?: string | null;
          ducats?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      card_designs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          ability_text: string | null;
          flavor_text: string | null;
          balance_notes: string | null;
          inspiration: string | null;
          mana_cost: number;
          attack: number | null;
          health: number | null;
          base_attack: number;
          base_health: number;
          rarity: CardRarity;
          card_type: CardType;
          category: CardCategory;
          image_url: string | null;
          max_supply: number | null;
          total_minted: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          // Token fields
          has_token: boolean;
          token_name: string | null;
          token_image_url: string | null;
          token_attack: number;
          token_health: number;
          token_trigger: string | null;
          token_count: number;
          token_max_summons: number;
          token_keywords: CardKeyword[] | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          ability_text?: string | null;
          flavor_text?: string | null;
          balance_notes?: string | null;
          inspiration?: string | null;
          mana_cost: number;
          attack?: number | null;
          health?: number | null;
          base_attack?: number;
          base_health?: number;
          rarity?: CardRarity;
          card_type?: CardType;
          category?: CardCategory;
          image_url?: string | null;
          max_supply?: number | null;
          total_minted?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          // Token fields
          has_token?: boolean;
          token_name?: string | null;
          token_image_url?: string | null;
          token_attack?: number;
          token_health?: number;
          token_trigger?: string | null;
          token_count?: number;
          token_max_summons?: number;
          token_keywords?: CardKeyword[] | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          ability_text?: string | null;
          flavor_text?: string | null;
          balance_notes?: string | null;
          inspiration?: string | null;
          mana_cost?: number;
          attack?: number | null;
          health?: number | null;
          base_attack?: number;
          base_health?: number;
          rarity?: CardRarity;
          card_type?: CardType;
          category?: CardCategory;
          image_url?: string | null;
          max_supply?: number | null;
          total_minted?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          // Token fields
          has_token?: boolean;
          token_name?: string | null;
          token_image_url?: string | null;
          token_attack?: number;
          token_health?: number;
          token_trigger?: string | null;
          token_count?: number;
          token_max_summons?: number;
          token_keywords?: CardKeyword[] | null;
        };
      };
      card_effects: {
        Row: {
          id: string;
          card_design_id: string;
          trigger: EffectTrigger;
          target: EffectTarget;
          action: EffectAction;
          value: number;
          summon_card_id: string | null;
          description: string | null;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_design_id: string;
          trigger: EffectTrigger;
          target: EffectTarget;
          action: EffectAction;
          value?: number;
          summon_card_id?: string | null;
          description?: string | null;
          priority?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          card_design_id?: string;
          trigger?: EffectTrigger;
          target?: EffectTarget;
          action?: EffectAction;
          value?: number;
          summon_card_id?: string | null;
          description?: string | null;
          priority?: number;
          created_at?: string;
        };
      };
      card_keywords: {
        Row: {
          id: string;
          card_design_id: string;
          keyword: CardKeyword;
        };
        Insert: {
          id?: string;
          card_design_id: string;
          keyword: CardKeyword;
        };
        Update: {
          id?: string;
          card_design_id?: string;
          keyword?: CardKeyword;
        };
      };
      card_instances: {
        Row: {
          id: string;
          design_id: string;
          owner_id: string | null;
          edition: number;
          serial_number: number;
          edition_size: number;
          minted_at: string;
          minted_by: string | null;
          is_listed: boolean;
          list_price: number | null;
          listed_at: string | null;
        };
        Insert: {
          id?: string;
          design_id: string;
          owner_id?: string | null;
          edition?: number;
          serial_number: number;
          edition_size: number;
          minted_at?: string;
          minted_by?: string | null;
          is_listed?: boolean;
          list_price?: number | null;
          listed_at?: string | null;
        };
        Update: {
          id?: string;
          design_id?: string;
          owner_id?: string | null;
          edition?: number;
          serial_number?: number;
          edition_size?: number;
          minted_at?: string;
          minted_by?: string | null;
          is_listed?: boolean;
          list_price?: number | null;
          listed_at?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          type: TransactionType;
          from_player_id: string | null;
          to_player_id: string | null;
          game_master_id: string | null;
          card_instance_id: string | null;
          ducats_amount: number | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: TransactionType;
          from_player_id?: string | null;
          to_player_id?: string | null;
          game_master_id?: string | null;
          card_instance_id?: string | null;
          ducats_amount?: number | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: TransactionType;
          from_player_id?: string | null;
          to_player_id?: string | null;
          game_master_id?: string | null;
          card_instance_id?: string | null;
          ducats_amount?: number | null;
          description?: string | null;
          created_at?: string;
        };
      };
      decks: {
        Row: {
          id: string;
          player_id: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      deck_cards: {
        Row: {
          id: string;
          deck_id: string;
          card_instance_id: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          card_instance_id: string;
        };
        Update: {
          id?: string;
          deck_id?: string;
          card_instance_id?: string;
        };
      };
    };
    Functions: {
      is_game_master: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      get_current_edition: {
        Args: { design_uuid: string };
        Returns: number;
      };
    };
  };
}

// Convenience types
export type GameMaster = Database['public']['Tables']['game_masters']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type CardDesign = Database['public']['Tables']['card_designs']['Row'];
export type CardInstance = Database['public']['Tables']['card_instances']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Deck = Database['public']['Tables']['decks']['Row'];
export type DeckCard = Database['public']['Tables']['deck_cards']['Row'];
export type CardEffect = Database['public']['Tables']['card_effects']['Row'];
export type CardKeywordRow = Database['public']['Tables']['card_keywords']['Row'];

// Card instance with design info (for display)
export type CardInstanceWithDesign = CardInstance & {
  card_designs: CardDesign;
};

// Full card design with keywords and effects (from view or joined query)
export interface CardDesignFull extends CardDesign {
  keywords: CardKeyword[];
  effects: CardEffect[];
}

// Keyword display info
export const KEYWORD_INFO: Record<CardKeyword, { icon: string; name: string; description: string }> = {
  frontline: { icon: '🏰', name: 'Frontline', description: 'Can be targeted by enemy attacks' },
  quick: { icon: '⚡', name: 'Quick', description: 'Can attack immediately when summoned' },
  evasion: { icon: '🌀', name: 'Evasion', description: '50% chance to avoid attacks' },
  boost: { icon: '⭐', name: 'Boost', description: 'Gets stronger each turn alive' },
};

// Effect trigger display info
export const TRIGGER_INFO: Record<EffectTrigger, { icon: string; name: string }> = {
  on_play: { icon: '🎴', name: 'On Play' },
  on_destroy: { icon: '💀', name: 'On Destroy' },
  on_attack: { icon: '⚔️', name: 'On Attack' },
  on_damaged: { icon: '🎯', name: 'On Damaged' },
  end_of_turn: { icon: '🌙', name: 'End of Turn' },
  start_of_turn: { icon: '🌅', name: 'Start of Turn' },
};

// Effect action display info
export const ACTION_INFO: Record<EffectAction, { icon: string; name: string; description: string }> = {
  damage: { icon: '💥', name: 'Damage', description: 'Deal damage to target (reduces health)' },
  heal: { icon: '💚', name: 'Heal', description: 'Restore health to target' },
  draw: { icon: '🃏', name: 'Draw', description: 'Draw cards from your deck' },
  buff_attack: { icon: '⚔️', name: 'Buff Attack', description: 'Permanently increase attack' },
  buff_health: { icon: '🛡️', name: 'Buff Health', description: 'Permanently increase max health' },
  destroy: { icon: '💀', name: 'Destroy', description: 'Instantly kill the target unit' },
  summon: { icon: '🎭', name: 'Summon', description: 'Create token units on the board' },
  silence: { icon: '🤫', name: 'Silence', description: 'Remove all effects from target' },
  return_hand: { icon: '🔄', name: 'Return Hand', description: 'Send target back to owner\'s hand' },
  copy: { icon: '📋', name: 'Copy', description: 'Duplicate another card\'s effects' },
  stun: { icon: '😵', name: 'Stun', description: 'Unit cannot attack next turn' },
};

// Target display info
export const TARGET_INFO: Record<EffectTarget, { icon: string; name: string; description: string }> = {
  self: { icon: '🪞', name: 'Self', description: 'This card/unit' },
  friendly_unit: { icon: '💚', name: 'Friendly Unit', description: 'Choose your unit' },
  enemy_unit: { icon: '💔', name: 'Enemy Unit', description: 'Choose opponent\'s unit' },
  any_unit: { icon: '🎲', name: 'Any Unit', description: 'Choose any unit on the board' },
  friendly_player: { icon: '👤', name: 'Friendly Player', description: 'Your health/mana' },
  enemy_player: { icon: '👥', name: 'Enemy Player', description: 'Opponent\'s health/mana' },
  all_friendly: { icon: '💚', name: 'All Friendly', description: 'All your units' },
  all_enemies: { icon: '💔', name: 'All Enemies', description: 'All opponent units' },
  all_units: { icon: '🎲', name: 'All Units', description: 'Every unit on the board' },
  random_enemy: { icon: '🎯', name: 'Random Enemy', description: 'Random enemy unit' },
  random_friendly: { icon: '🎲', name: 'Random Friendly', description: 'Random your unit' },
};

// Token trigger display info
export const TOKEN_TRIGGER_INFO: Record<TokenTrigger, { icon: string; name: string; description: string }> = {
  on_play: { icon: '🎴', name: 'On Play', description: 'When parent card is played' },
  on_destroy: { icon: '💀', name: 'On Destroy', description: 'When parent unit dies' },
  on_attack: { icon: '⚔️', name: 'On Attack', description: 'When parent unit attacks' },
  on_damaged: { icon: '🎯', name: 'On Damaged', description: 'When parent takes damage' },
};

