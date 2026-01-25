# Lolstone - The Meme Card Battle Game

A real-time multiplayer card battle game built with React Native, Expo, and Supabase. Players collect, trade, and battle with meme-inspired cards in turn-based combat.

## 🚀 Features

- **Real-time Multiplayer**: Instant game synchronization without manual refreshes
- **Card Collection**: Mint, collect, and trade unique meme cards
- **Turn-based Combat**: Strategic battles with special abilities and effects
- **Game Master Panel**: Administrative tools for managing the game economy
- **Cross-platform**: Works on web, iOS, and Android via Expo
- **Secure Authentication**: Supabase-powered user management

## 🎮 How to Play

1. **Register/Login**: Create an account or log in as a player
2. **Buy Booster Packs**: Purchase card packs with in-game currency
3. **Build Your Deck**: Select cards for battle from your collection
4. **Find a Match**: Join the matchmaking queue
5. **Battle!**: Take turns playing cards and attacking opponents

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: Custom game engine with reducer pattern
- **Real-time Sync**: Supabase realtime subscriptions + polling
- **Payments**: Solana blockchain integration

## 🏗️ Architecture

### Game Engine
- `src/game/reducer.ts`: Central game state management
- `src/game/state.ts`: Game state transitions and effects
- `src/game/combat.ts`: Battle mechanics and attack resolution
- `src/game/effects.ts`: Card abilities and special effects

### Real-time Sync Architecture
The game implements a robust multi-layer real-time synchronization system:

#### The Problem (Fixed)
Initially, when players made moves, the opponent would not see updates in real-time, requiring manual page refreshes. This happened because:

1. Player A makes a move → triggers database save
2. Supabase realtime subscription notifies Player B's browser
3. `applyServerState()` calls `GameInstance.setState(serverState)`
4. **BUG**: `setState()` updated internal state but didn't notify UI subscribers
5. Player B's UI never updated because no subscription callback was triggered

#### The Solution
Enhanced the `GameInstance.setState()` method with subscriber notification control:

```typescript
// Before: Always silent update (no UI notification)
setState(newState: GameState): void {
  this.state = newState;
}

// After: Optional subscriber notification
setState(newState: GameState, notifySubscribers: boolean = false): void {
  this.state = newState;
  if (notifySubscribers) {
    for (const subscriber of this.subscribers) {
      subscriber(this.state);
    }
  }
}
```

Now `applyServerState()` calls `setState(serverState, true)` to trigger UI updates.

#### Multi-layer Sync Strategy
1. **Primary**: Supabase realtime subscriptions for instant updates
2. **Backup**: Aggressive polling every 200ms for guaranteed sync
3. **Recovery**: Tab visibility detection for resuming sync after tab switches
4. **Safety**: Minimum 100ms gap between polls to prevent server overload

This ensures 100% real-time gameplay with multiple fallback mechanisms.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lolstone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env` file with your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   Run the Supabase migrations in order:
   ```bash
   # Apply all migrations to your Supabase project
   # See supabase/migrations/ for the complete schema
   ```

5. **Start Development Server**
   ```bash
   npm start
   ```

6. **Run on Platform**
   - **Web**: `npm run web`
   - **iOS**: `npm run ios`
   - **Android**: `npm run android`

## 🎯 Game Mechanics

### Card Types
- **Units**: Creatures with attack/defense stats
- **Spells**: One-time effects and abilities
- **Tokens**: Temporary units summoned by effects

### Special Abilities
- **Charge**: Can attack immediately when played
- **Taunt**: Forces opponent to attack this unit first
- **Quick**: Can act the same turn it's summoned
- **Effect**: Triggers special abilities (damage, heal, summon)

### Win Conditions
- Reduce opponent's health to 0
- Opponent concedes the game

## 👑 Game Master Panel

Access via `/gmp/login` with admin credentials:

- **Card Management**: Create, edit, and mint new cards
- **Player Management**: View stats, give cards, manage accounts
- **Economy Control**: Monitor and adjust game economy
- **Real-time Monitoring**: Live game statistics and player activity

## 🔒 Security

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure user sessions via Supabase Auth
- **Permission-based Access**: Different roles (Player, Game Master)
- **Input Validation**: Client and server-side validation

## 🚀 Deployment

### Web Deployment (Vercel)

1. **Set Environment Variables in Vercel**
   
   ⚠️ **IMPORTANT**: For Expo static exports, environment variables must be set in Vercel **before** building.
   
   Go to your Vercel project:
   - Dashboard → Your Project → Settings → Environment Variables
   - Add the following variables:
     - `EXPO_PUBLIC_SUPABASE_URL` = Your Supabase project URL
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon/public key
   - Make sure to select **all environments** (Production, Preview, Development)
   - Click "Save"

2. **Redeploy**
   
   After adding environment variables, you **must redeploy**:
   - Go to Deployments tab
   - Click "..." on the latest deployment → "Redeploy"
   - Or push a new commit to trigger a new deployment

3. **Verify**
   
   After deployment, check the browser console. You should see:
   - ✅ No errors about missing environment variables
   - ✅ Successful connection to Supabase
   - ✅ Data loading correctly

**Note**: The `.env` file is only for local development. Vercel uses its own environment variables configured in the dashboard.

### Mobile Deployment
```bash
expo build:ios
expo build:android
```

## 🐛 Troubleshooting

### Environment Variables Not Working in Production

**Symptoms**: App doesn't connect to Supabase, shows blank pages, or errors about missing variables.

**Solution**:
1. ✅ Verify environment variables are set in Vercel Dashboard
2. ✅ Check that variables are named exactly: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. ✅ Ensure variables are set for **all environments** (Production, Preview, Development)
4. ✅ **Redeploy** after adding/changing environment variables (they're baked in at build time)
5. ✅ Check browser console for error messages - the code will log helpful debugging info

**Debug Steps**:
- Open browser console on your deployed site
- Look for error messages starting with "❌ Missing required environment variables"
- The console will show which variables are missing and how to fix it

### Real-time Sync Issues
If players aren't seeing updates in real-time:
1. Check browser console for realtime subscription errors
2. Verify Supabase RLS policies allow proper access
3. Ensure polling fallback is working (logs every 10th poll)

### Game State Desync
If game states become inconsistent:
1. Check that all action handlers call `onStateChange()`
2. Verify database saves are successful
3. Monitor polling frequency and server load

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-mechanic`
3. Commit changes: `git commit -m 'Add new card ability'`
4. Push to branch: `git push origin feature/new-mechanic`
5. Submit a Pull Request

## 📄 License

This project is private and proprietary.

## 🎮 Demo

Visit the live demo at: [Your deployment URL]

Experience real-time multiplayer battles with instant synchronization - no more manual refreshes required! ⚡
