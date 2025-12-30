// Generated types for Supabase database
// These match the schema in supabase/schema.sql

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CardType = 'meme_minion' | 'viral_spell' | 'troll_legendary' | 'reaction_trap' | 'copypasta_enchantment';
export type TransactionType = 'mint' | 'grant_ducats' | 'purchase' | 'reward' | 'trade';

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
          mana_cost: number;
          attack: number | null;
          health: number | null;
          rarity: CardRarity;
          card_type: CardType;
          image_url: string | null;
          max_supply: number | null;
          total_minted: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          ability_text?: string | null;
          flavor_text?: string | null;
          mana_cost: number;
          attack?: number | null;
          health?: number | null;
          rarity?: CardRarity;
          card_type?: CardType;
          image_url?: string | null;
          max_supply?: number | null;
          total_minted?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          ability_text?: string | null;
          flavor_text?: string | null;
          mana_cost?: number;
          attack?: number | null;
          health?: number | null;
          rarity?: CardRarity;
          card_type?: CardType;
          image_url?: string | null;
          max_supply?: number | null;
          total_minted?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
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

// Card instance with design info (for display)
export type CardInstanceWithDesign = CardInstance & {
  card_designs: CardDesign;
};

