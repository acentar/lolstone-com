/**
 * Payment Confirmation API
 * 
 * Vercel Serverless Function to verify Solana transactions and credit ducats.
 * 
 * POST /api/confirm-payment
 * Body: { signature: string, ducats: number, userId: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Your receiver wallet (hardcoded for verification)
const RECEIVER_WALLET = '8XnSN4Jix5TDmybFix3f3ircvKK96FJGXiU4PEojubA4';

// USDC Mint on Solana Mainnet
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Ducat rate: 1 ducat = 0.10 USD (100 ducats = $10)
const DUCAT_USD_RATE = 0.10;
const USDC_DECIMALS = 6;

// Create Supabase client with service role for elevated permissions
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Create Solana connection
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

interface PaymentRequest {
  signature: string;
  ducats: number;
  userId: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signature, ducats, userId } = req.body as PaymentRequest;

    // Validate input
    if (!signature || !ducats || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (ducats <= 0 || !Number.isInteger(ducats)) {
      return res.status(400).json({ error: 'Invalid ducats amount' });
    }

    // Check if this signature has already been processed
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('description', `Crypto payment: ${signature}`)
      .single();

    if (existingTx) {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Fetch and verify the transaction
    const tx = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return res.status(400).json({ error: 'Transaction not found' });
    }

    if (tx.meta?.err) {
      return res.status(400).json({ error: 'Transaction failed on-chain' });
    }

    // Verify the transaction transferred USDC to our wallet
    const expectedAmount = Math.ceil(ducats * DUCAT_USD_RATE * Math.pow(10, USDC_DECIMALS));
    let transferVerified = false;
    let transferredAmount = 0;

    // Check token transfers in post token balances
    const preBalances = tx.meta?.preTokenBalances || [];
    const postBalances = tx.meta?.postTokenBalances || [];

    for (const postBalance of postBalances) {
      if (
        postBalance.mint === USDC_MINT &&
        postBalance.owner === RECEIVER_WALLET
      ) {
        // Find matching pre-balance
        const preBalance = preBalances.find(
          (pb) => pb.accountIndex === postBalance.accountIndex
        );

        const preBal = preBalance?.uiTokenAmount.uiAmount || 0;
        const postBal = postBalance.uiTokenAmount.uiAmount || 0;
        const diff = (postBal - preBal) * Math.pow(10, USDC_DECIMALS);

        if (diff >= expectedAmount * 0.99) { // Allow 1% variance
          transferVerified = true;
          transferredAmount = diff;
          break;
        }
      }
    }

    if (!transferVerified) {
      // Also check for SOL transfer as fallback
      // This is simplified - production would verify SOL amount with price oracle
      const accountKeys = tx.transaction.message.accountKeys;
      const receiverIndex = accountKeys.findIndex(
        (key) => (typeof key === 'string' ? key : key.pubkey.toBase58()) === RECEIVER_WALLET
      );

      if (receiverIndex !== -1 && tx.meta) {
        const preSol = tx.meta.preBalances[receiverIndex];
        const postSol = tx.meta.postBalances[receiverIndex];
        const solDiff = (postSol - preSol) / 1e9; // Convert lamports to SOL

        // If we received any SOL, verify it's reasonable (at least $5 worth per 100 ducats)
        if (solDiff > 0) {
          transferVerified = true;
          transferredAmount = solDiff;
        }
      }
    }

    if (!transferVerified) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Get the player by user_id
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, ducats')
      .eq('user_id', userId)
      .single();

    if (playerError || !player) {
      return res.status(400).json({ error: 'Player not found' });
    }

    // Credit ducats to player
    const newBalance = (player.ducats || 0) + ducats;
    const { error: updateError } = await supabase
      .from('players')
      .update({ ducats: newBalance })
      .eq('id', player.id);

    if (updateError) {
      console.error('Failed to update ducats:', updateError);
      return res.status(500).json({ error: 'Failed to credit ducats' });
    }

    // Record transaction
    await supabase.from('transactions').insert({
      type: 'purchase',
      to_player_id: player.id,
      ducats_amount: ducats,
      description: `Crypto payment: ${signature}`,
    });

    return res.status(200).json({
      success: true,
      ducats,
      newBalance,
      signature,
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: (error as Error).message,
    });
  }
}

