/**
 * Crypto Payment Utilities
 *
 * Handles Solana/USDC price fetching and payment calculations.
 * 1 ducat = 0.10 USD (100 ducats = $10)
 */

// Dynamic imports to avoid Buffer issues on initial load
let PublicKey: any;
let Connection: any;
let Transaction: any;
let clusterApiUrl: any;
let getAssociatedTokenAddress: any;
let createTransferInstruction: any;
let TOKEN_PROGRAM_ID: any;

// Lazy load Solana libraries
const loadSolanaLibs = async () => {
  if (!PublicKey) {
    const web3 = await import('@solana/web3.js');
    PublicKey = web3.PublicKey;
    Connection = web3.Connection;
    Transaction = web3.Transaction;
    clusterApiUrl = web3.clusterApiUrl;
  }
  if (!getAssociatedTokenAddress) {
    const spl = await import('@solana/spl-token');
    getAssociatedTokenAddress = spl.getAssociatedTokenAddress;
    createTransferInstruction = spl.createTransferInstruction;
    TOKEN_PROGRAM_ID = spl.TOKEN_PROGRAM_ID;
  }
};

// Your receiver wallet address (hardcoded - keep private key offline!)
export const RECEIVER_WALLET_ADDRESS = 'BStVdWMMpN7vZG1hs1wvNDACmNkSZzLehrx3Tb61zm7G';

// USDC Mint on Solana Mainnet
export const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Meme Coin Mint Address
export const MEME_COIN_MINT_ADDRESS = 'BDD5XKXLSC6fSAFmTVpVWFTdfSSG7a2LTYxBXt6rpump';

// Lazy-loaded PublicKey instances
let RECEIVER_WALLET: any = null;
let USDC_MINT: any = null;
let MEME_COIN_MINT: any = null;

const getReceiverWallet = async () => {
  await loadSolanaLibs();
  // Always create fresh PublicKey to ensure we use the current RECEIVER_WALLET_ADDRESS
  return new PublicKey(RECEIVER_WALLET_ADDRESS);
};

const getUsdcMint = async () => {
  if (!USDC_MINT) {
    await loadSolanaLibs();
    USDC_MINT = new PublicKey(USDC_MINT_ADDRESS);
  }
  return USDC_MINT;
};

const getMemeCoinMint = async () => {
  if (!MEME_COIN_MINT) {
    await loadSolanaLibs();
    MEME_COIN_MINT = new PublicKey(MEME_COIN_MINT_ADDRESS);
  }
  return MEME_COIN_MINT;
};

// USDC decimals (6)
export const USDC_DECIMALS = 6;

// SOL decimals (9)
export const SOL_DECIMALS = 9;

// Meme Coin decimals (typically 6 for most SPL tokens, but may vary)
// Most meme coins use 6 decimals, adjust if needed
export const MEME_COIN_DECIMALS = 6;

// Ducat rate: 1 ducat = 0.10 USD (100 ducats = $10)
export const DUCAT_USD_RATE = 0.10;

// SOL price buffer (5% for volatility)
export const SOL_PRICE_BUFFER = 0.05;

// Connection to Solana mainnet
export const getConnection = async () => {
  await loadSolanaLibs();
  return new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
};

/**
 * Get USDC price (always ~$1)
 */
export async function getUsdcPrice(): Promise<number> {
  return 1; // USDC is a stablecoin, always ~$1
}

/**
 * Get SOL price in USD from CoinGecko
 */
export async function getSolPriceUsd(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await res.json();
    return data.solana.usd;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    // Fallback to a default price if API fails
    return 150; // Reasonable fallback
  }
}

/**
 * Get Meme Coin price in USD
 * For now, we'll use a default price or fetch from an API
 * You can update this to fetch from Jupiter, Birdeye, or another price API
 */
export async function getMemeCoinPriceUsd(): Promise<number> {
  try {
    // Try to fetch from Jupiter API (common for Solana tokens)
    const res = await fetch(`https://price.jup.ag/v4/price?ids=${MEME_COIN_MINT_ADDRESS}`);
    const data = await res.json();
    if (data.data && data.data[MEME_COIN_MINT_ADDRESS]) {
      return data.data[MEME_COIN_MINT_ADDRESS].price;
    }
  } catch (error) {
    console.error('Error fetching meme coin price:', error);
  }
  
  // Fallback: You may want to set a default price here
  // For now, returning a placeholder - you should set the actual price
  console.warn('Using default meme coin price. Update getMemeCoinPriceUsd() with actual price fetching.');
  return 0.0001; // Placeholder - UPDATE THIS with actual price
}

/**
 * Calculate USDC amount needed for ducats
 * @param ducats - Number of ducats to purchase
 * @returns Amount in USDC (with 6 decimals as integer)
 */
export function calculateUsdcAmount(ducats: number): number {
  const usd = ducats * DUCAT_USD_RATE;
  return Math.ceil(usd * Math.pow(10, USDC_DECIMALS)); // Convert to smallest unit
}

/**
 * Calculate SOL amount needed for ducats
 * @param ducats - Number of ducats to purchase
 * @param solPriceUsd - Current SOL price in USD
 * @returns Amount in SOL lamports (with 9 decimals as integer)
 */
export function calculateSolAmount(ducats: number, solPriceUsd: number): number {
  const usd = ducats * DUCAT_USD_RATE;
  const solAmount = usd / solPriceUsd;
  const solWithBuffer = solAmount * (1 + SOL_PRICE_BUFFER); // Add 5% buffer
  return Math.ceil(solWithBuffer * Math.pow(10, SOL_DECIMALS)); // Convert to lamports
}

/**
 * Format USDC amount for display
 */
export function formatUsdcAmount(lamports: number): string {
  const usdc = lamports / Math.pow(10, USDC_DECIMALS);
  return usdc.toFixed(2);
}

/**
 * Format SOL amount for display
 */
export function formatSolAmount(lamports: number): string {
  const sol = lamports / Math.pow(10, SOL_DECIMALS);
  return sol.toFixed(4);
}

/**
 * Calculate Meme Coin amount needed for ducats
 * @param ducats - Number of ducats to purchase
 * @param memeCoinPriceUsd - Current meme coin price in USD
 * @returns Amount in meme coin tokens (with decimals as integer)
 */
export function calculateMemeCoinAmount(ducats: number, memeCoinPriceUsd: number): number {
  if (memeCoinPriceUsd <= 0) {
    throw new Error('Invalid meme coin price');
  }
  const usd = ducats * DUCAT_USD_RATE;
  const tokenAmount = usd / memeCoinPriceUsd;
  const tokenWithBuffer = tokenAmount * (1 + SOL_PRICE_BUFFER); // Add 5% buffer for volatility
  return Math.ceil(tokenWithBuffer * Math.pow(10, MEME_COIN_DECIMALS)); // Convert to smallest unit
}

/**
 * Format Meme Coin amount for display
 */
export function formatMemeCoinAmount(tokens: number): string {
  const amount = tokens / Math.pow(10, MEME_COIN_DECIMALS);
  // Format with appropriate decimal places based on amount
  if (amount >= 1000) {
    return amount.toFixed(0);
  } else if (amount >= 1) {
    return amount.toFixed(2);
  } else {
    return amount.toFixed(6);
  }
}

/**
 * Ducat packages for purchase
 */
export const DUCAT_PACKAGES = [
  { ducats: 100, usd: 5, label: 'Mini Pack' },
  { ducats: 500, usd: 25, label: 'Starter Pack' },
  { ducats: 1000, usd: 50, label: 'Value Pack' },
  { ducats: 2500, usd: 125, label: 'Premium Pack' },
  { ducats: 5000, usd: 250, label: 'Whale Pack' },
  { ducats: 10000, usd: 500, label: 'Mega Pack' },
];

/**
 * Create a USDC transfer transaction
 * Note: If connection is null, blockhash will not be set - Phantom will add it
 */
export async function createUsdcTransferTransaction(
  senderPublicKey: any,
  ducats: number,
  connection: any
): Promise<any> {
  await loadSolanaLibs();

  const amount = calculateUsdcAmount(ducats);

  // Get the mint and receiver wallet
  const mint = await getUsdcMint();
  const receiver = await getReceiverWallet();

  // Get associated token addresses
  const senderATA = await getAssociatedTokenAddress(mint, senderPublicKey);
  const receiverATA = await getAssociatedTokenAddress(mint, receiver);

  // Create transfer instruction
  const transferInstruction = createTransferInstruction(
    senderATA,
    receiverATA,
    senderPublicKey,
    amount,
    [],
    TOKEN_PROGRAM_ID
  );

  // Create transaction
  const transaction = new Transaction().add(transferInstruction);

  // Set fee payer
  transaction.feePayer = senderPublicKey;

  // Get latest blockhash if connection is available
  // Otherwise, Phantom will add it when signing
  if (connection) {
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
    } catch (error) {
      console.warn('Failed to get blockhash, Phantom will add it:', error);
      // Phantom can handle transactions without blockhash
    }
  }

  return transaction;
}

/**
 * Create a SOL transfer transaction
 * Uses SystemProgram.transfer for native SOL
 */
export async function createSolTransferTransaction(
  senderPublicKey: any,
  ducats: number,
  solPriceUsd: number,
  connection: any
): Promise<any> {
  await loadSolanaLibs();
  
  // Also import SystemProgram and LAMPORTS_PER_SOL
  const { SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');

  const lamports = calculateSolAmount(ducats, solPriceUsd);
  const receiver = await getReceiverWallet();

  // Create SOL transfer instruction
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: senderPublicKey,
    toPubkey: receiver,
    lamports: lamports,
  });

  // Create transaction
  const transaction = new Transaction().add(transferInstruction);

  // Set fee payer
  transaction.feePayer = senderPublicKey;

  // Get latest blockhash if connection is available
  if (connection) {
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
    } catch (error) {
      console.warn('Failed to get blockhash, Phantom will add it:', error);
    }
  }

  return transaction;
}

/**
 * Create a Meme Coin transfer transaction
 * 
 * Note: For SPL tokens, transfers go to the Associated Token Account (ATA), not directly to the wallet.
 * The ATA address (e.g., DnXTuYaNaGyq4N37Xr2PHGjhv8eiWFtrS4RGzH8pFfkg) is derived from the 
 * receiver wallet (BStVdWMMpN7vZG1hs1wvNDACmNkSZzLehrx3Tb61zm7G) and token mint.
 * This is correct behavior - the ATA is owned by the receiver wallet.
 */
export async function createMemeCoinTransferTransaction(
  senderPublicKey: any,
  ducats: number,
  memeCoinPriceUsd: number,
  connection: any
): Promise<any> {
  await loadSolanaLibs();

  const amount = calculateMemeCoinAmount(ducats, memeCoinPriceUsd);

  // Get the mint and receiver wallet
  const mint = await getMemeCoinMint();
  const receiver = await getReceiverWallet();

  // Verify we're using the correct receiver wallet
  if (receiver.toBase58() !== RECEIVER_WALLET_ADDRESS) {
    console.error('❌ ERROR: Receiver wallet mismatch!');
    console.error('  Expected:', RECEIVER_WALLET_ADDRESS);
    console.error('  Got:', receiver.toBase58());
    throw new Error('Receiver wallet configuration error');
  }

  // Get associated token addresses
  // For SPL tokens, we must transfer to the ATA, not the wallet directly
  const senderATA = await getAssociatedTokenAddress(mint, senderPublicKey);
  const receiverATA = await getAssociatedTokenAddress(mint, receiver);

  // Debug: Log addresses for verification
  console.log('🔍 LOLS Transfer:');
  console.log('  Receiver Wallet:', receiver.toBase58());
  console.log('  Receiver ATA (destination):', receiverATA.toBase58());
  console.log('  Amount:', amount.toString());

  // Create transfer instruction
  const transferInstruction = createTransferInstruction(
    senderATA,
    receiverATA,
    senderPublicKey,
    amount,
    [],
    TOKEN_PROGRAM_ID
  );

  // Create transaction
  const transaction = new Transaction().add(transferInstruction);

  // Set fee payer
  transaction.feePayer = senderPublicKey;

  // Get latest blockhash if connection is available
  if (connection) {
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
    } catch (error) {
      console.warn('Failed to get blockhash, Phantom will add it:', error);
    }
  }

  return transaction;
}

/**
 * Verify a transaction was successful
 */
export async function verifyTransaction(
  signature: string,
  connection?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const conn = connection || await getConnection();
    const tx = await conn.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { success: false, error: 'Transaction not found' };
    }

    if (tx.meta?.err) {
      return { success: false, error: 'Transaction failed' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

