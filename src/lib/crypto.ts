/**
 * Crypto Payment Utilities
 * 
 * Handles Solana/USDC price fetching and payment calculations.
 * 1 ducat = 0.01 USD
 */

import { PublicKey, Connection, Transaction, clusterApiUrl } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Your receiver wallet address (hardcoded - keep private key offline!)
export const RECEIVER_WALLET = new PublicKey('8XnSN4Jix5TDmybFix3f3ircvKK96FJGXiU4PEojubA4');

// USDC Mint on Solana Mainnet
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// USDC decimals (6)
export const USDC_DECIMALS = 6;

// SOL decimals (9)
export const SOL_DECIMALS = 9;

// Ducat rate: 1 ducat = 0.01 USD
export const DUCAT_USD_RATE = 0.01;

// SOL price buffer (5% for volatility)
export const SOL_PRICE_BUFFER = 0.05;

// Connection to Solana mainnet
export const getConnection = () => new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

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
  senderPublicKey: PublicKey,
  ducats: number,
  connection: Connection
): Promise<Transaction> {
  const amount = calculateUsdcAmount(ducats);
  
  // Get associated token addresses
  const senderATA = await getAssociatedTokenAddress(USDC_MINT, senderPublicKey);
  const receiverATA = await getAssociatedTokenAddress(USDC_MINT, RECEIVER_WALLET);
  
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
  connection: Connection
): Promise<{ success: boolean; error?: string }> {
  try {
    const tx = await connection.getParsedTransaction(signature, {
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

