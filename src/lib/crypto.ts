/**
 * Crypto Payment Utilities
 *
 * Handles Solana/USDC price fetching and payment calculations.
 * 1 ducat = 0.01 USD
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

// Lazy-loaded PublicKey instances
let RECEIVER_WALLET: any = null;
let USDC_MINT: any = null;

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

// USDC decimals (6)
export const USDC_DECIMALS = 6;

// SOL decimals (9)
export const SOL_DECIMALS = 9;

// Ducat rate: 1 ducat = 0.01 USD
export const DUCAT_USD_RATE = 0.01;

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
 * Ducat packages for purchase
 */
export const DUCAT_PACKAGES = [
  { ducats: 500, usd: 5, label: 'Starter Pack' },
  { ducats: 1000, usd: 10, label: 'Value Pack' },
  { ducats: 2500, usd: 25, label: 'Premium Pack' },
  { ducats: 5000, usd: 50, label: 'Whale Pack' },
  { ducats: 10000, usd: 100, label: 'Mega Pack' },
];

/**
 * Create a USDC transfer transaction
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

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = senderPublicKey;

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

