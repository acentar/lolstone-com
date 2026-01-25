/**
 * Card OG Image API
 * 
 * Generates Open Graph image for card pages for social media sharing.
 * 
 * GET /api/card-og-image/[id]
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_URL ? '' : process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const RARITY_COLORS: Record<string, string> = {
  common: '#71717a',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    // Fetch card design
    const { data: card, error } = await supabase
      .from('card_designs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const rarityColor = RARITY_COLORS[card.rarity] || '#71717a';
    const cardName = card.name || 'Unknown Card';
    const inspiration = card.inspiration || '';

    // Generate HTML for the OG image
    // This is a simple version - you can enhance it with @vercel/og for better rendering
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #0a0a0f 0%, #1a1a26 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: white;
            }
            .container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 60px;
              position: relative;
              overflow: hidden;
            }
            .glow {
              position: absolute;
              width: 800px;
              height: 800px;
              border-radius: 50%;
              background: radial-gradient(circle, ${rarityColor}40 0%, transparent 70%);
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }
            .card-preview {
              position: relative;
              z-index: 1;
              margin-bottom: 40px;
            }
            .card-name {
              font-size: 64px;
              font-weight: 900;
              text-align: center;
              margin-bottom: 20px;
              text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
              color: white;
            }
            .card-info {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
            }
            .badge {
              padding: 12px 24px;
              border-radius: 20px;
              font-size: 18px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .rarity-badge {
              background: ${rarityColor};
              color: white;
            }
            .type-badge {
              background: rgba(255, 255, 255, 0.15);
              color: white;
            }
            .inspiration {
              font-size: 24px;
              text-align: center;
              color: rgba(255, 255, 255, 0.8);
              max-width: 900px;
              line-height: 1.6;
            }
            .logo {
              position: absolute;
              top: 40px;
              left: 40px;
              font-size: 32px;
              font-weight: 900;
              color: #00f5d4;
              letter-spacing: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="glow"></div>
            <div class="logo">LOLSTONE</div>
            <div class="card-preview">
              ${card.image_url ? `<img src="${card.image_url}" alt="${cardName}" style="max-width: 300px; max-height: 400px; border-radius: 16px;" />` : ''}
            </div>
            <div class="card-name">${cardName}</div>
            <div class="card-info">
              <div class="badge rarity-badge">${card.rarity}</div>
              <div class="badge type-badge">${card.card_type.replace('_', ' ')}</div>
            </div>
            ${inspiration ? `<div class="inspiration">${inspiration}</div>` : ''}
          </div>
        </body>
      </html>
    `;

    // For now, return HTML that can be rendered by a service
    // In production, you'd use @vercel/og or puppeteer to generate an actual image
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error generating OG image:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
