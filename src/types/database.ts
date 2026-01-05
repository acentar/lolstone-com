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
export const KEYWORD_INFO: Record<CardKeyword, { name: string; description: string; icon: string }> = {
  frontline: {
    name: 'Frontline',
    description: 'Enemies must attack this unit first',
    icon: '🛡️',
  },
  quick: {
    name: 'Quick',
    description: 'Can attack immediately when played',
    icon: '⚡',
  },
  evasion: {
    name: 'Evasion',
    description: 'Cannot be targeted by actions',
    icon: '💨',
  },
  boost: {
    name: 'Boost',
    description: '+1 Attack and +1 Health',
    icon: '💪',
  },
};

// Effect trigger display info
export const TRIGGER_INFO: Record<EffectTrigger, { name: string; icon: string }> = {
  on_play: { name: 'On Play', icon: '▶️' },
  on_destroy: { name: 'On Destroy', icon: '💀' },
  on_attack: { name: 'On Attack', icon: '⚔️' },
  on_damaged: { name: 'On Damaged', icon: '💔' },
  end_of_turn: { name: 'End of Turn', icon: '🔚' },
  start_of_turn: { name: 'Start of Turn', icon: '🔛' },
};

// Effect action display info
export const ACTION_INFO: Record<EffectAction, { name: string; icon: string }> = {
  damage: { name: 'Deal Damage', icon: '💥' },
  heal: { name: 'Heal', icon: '❤️‍🩹' },
  draw: { name: 'Draw Cards', icon: '🃏' },
  buff_attack: { name: 'Buff Attack', icon: '⚔️' },
  buff_health: { name: 'Buff Health', icon: '❤️' },
  destroy: { name: 'Destroy', icon: '☠️' },
  summon: { name: 'Summon', icon: '✨' },
  silence: { name: 'Silence', icon: '🤐' },
  return_hand: { name: 'Return to Hand', icon: '↩️' },
  copy: { name: 'Copy', icon: '📋' },
  stun: { name: 'Stun', icon: '🥶' },
};

// Target display info
export const TARGET_INFO: Record<EffectTarget, { name: string }> = {
  self: { name: 'This Unit' },
  friendly_unit: { name: 'Friendly Unit' },
  enemy_unit: { name: 'Enemy Unit' },
  any_unit: { name: 'Any Unit' },
  friendly_player: { name: 'Your Hero' },
  enemy_player: { name: 'Enemy Hero' },
  all_friendly: { name: 'All Friendly Units' },
  all_enemies: { name: 'All Enemy Units' },
  all_units: { name: 'All Units' },
  random_enemy: { name: 'Random Enemy' },
  random_friendly: { name: 'Random Friendly' },
};

// Token trigger display info
export const TOKEN_TRIGGER_INFO: Record<TokenTrigger, { name: string; icon: string; description: string }> = {
  on_play: { 
    name: 'On Play', 
    icon: '▶️',
    description: 'Summon tokens when this card is played'
  },
  on_destroy: { 
    name: 'On Destroy', 
    icon: '💀',
    description: 'Summon tokens when this unit is destroyed'
  },
  on_attack: { 
    name: 'On Attack', 
    icon: '⚔️',
    description: 'Summon a token when this unit attacks (limited uses)'
  },
  on_damaged: { 
    name: 'On Damaged', 
    icon: '💔',
    description: 'Summon a token when this unit takes damage (limited uses)'
  },
};

