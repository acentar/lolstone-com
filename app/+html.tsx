import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Default Meta Tags for Social Sharing */}
        <title>Lolstone - The Ultimate Digital Card Game</title>
        <meta name="description" content="Collect powerful cards, build unstoppable decks, and battle players in chaotic, meme-filled matches. Where strategy meets absurdity." />
        <meta property="og:title" content="Lolstone - The Ultimate Digital Card Game" />
        <meta property="og:description" content="Collect powerful cards, build unstoppable decks, and battle players in chaotic, meme-filled matches." />
        <meta property="og:image" content="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Lolstone" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lolstone - The Ultimate Digital Card Game" />
        <meta name="twitter:description" content="Collect powerful cards, build unstoppable decks, and battle players in chaotic, meme-filled matches." />
        <meta name="twitter:image" content="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/og-image.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/fav.png" />
        <link rel="shortcut icon" type="image/png" href="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/fav.png" />
        <link rel="apple-touch-icon" href="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/fav.png" />
        
        {/* Preconnect for faster loading */}
        <link rel="preconnect" href="https://taovuehsewbomdptruln.supabase.co" />
        <link rel="dns-prefetch" href="https://taovuehsewbomdptruln.supabase.co" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#0a0a0f" />
        
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
