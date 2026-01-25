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
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/fav.png" />
        <link rel="shortcut icon" type="image/png" href="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/fav.png" />
        <link rel="apple-touch-icon" href="https://taovuehsewbomdptruln.supabase.co/storage/v1/object/public/avatars/fav.png" />
        
        {/* Preconnect to Supabase for faster favicon loading */}
        <link rel="preconnect" href="https://taovuehsewbomdptruln.supabase.co" />
        
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
