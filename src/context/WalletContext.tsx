/**
 * Wallet Context for Solana/Phantom Integration
 *
 * Provides wallet connection and transaction capabilities for both web and mobile.
 * Web: Uses direct Phantom connection (no wallet adapter)
 * Mobile: Uses deep linking to Phantom app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

// Check if we're on web
const isWeb = Platform.OS === 'web';

interface WalletContextType {
  connected: boolean;
  publicKey: any; // PublicKey object from Phantom/Solana
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: any) => Promise<string>;
  connection: any;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  connecting: false,
  connect: async () => {},
  disconnect: async () => {},
  signAndSendTransaction: async () => '',
  connection: null,
});

export const useWalletContext = () => useContext(WalletContext);

/**
 * Web Wallet Provider - simplified, direct Phantom connection only
 * 
 * Uses free public RPCs that don't require API keys
 */

// Free public RPC endpoints (no API key required)
// Ankr is fast and reliable with generous free limits
const PRIMARY_RPC = 'https://rpc.ankr.com/solana';
// Fallback to Solana's public RPC
const FALLBACK_RPC = 'https://api.mainnet-beta.solana.com';

function WebWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<any>(null);

  // Create Solana connection on mount with free public RPC
  useEffect(() => {
    const createConnection = async () => {
      try {
        const { Connection } = await import('@solana/web3.js');
        // Use Ankr RPC (free, no API key required)
        const conn = new Connection(PRIMARY_RPC, 'confirmed');
        setConnection(conn);
        console.log('Solana connection created (Ankr RPC)');
      } catch (error) {
        console.error('Failed to create Solana connection:', error);
        // Try fallback
        try {
          const { Connection } = await import('@solana/web3.js');
          const conn = new Connection(FALLBACK_RPC, 'confirmed');
          setConnection(conn);
          console.log('Solana connection created (fallback RPC)');
        } catch (fallbackError) {
          console.error('Fallback connection also failed:', fallbackError);
        }
      }
    };

    createConnection();
  }, []);

  // Auto-connect if Phantom was previously connected
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!isWeb || typeof window === 'undefined') return;
      
      try {
        const { solana } = window as any;
        if (solana?.isPhantom && solana?.isConnected) {
          console.log('Phantom already connected, restoring session...');
          // Use connect with onlyIfTrusted to silently reconnect
          const response = await solana.connect({ onlyIfTrusted: true });
          setConnected(true);
          setPublicKey(response.publicKey);
          console.log('Session restored:', response.publicKey.toString());
        }
      } catch (error) {
        // User has not previously connected, that's fine
        console.log('No existing Phantom session');
      }
    };

    // Small delay to ensure Phantom extension is loaded
    setTimeout(checkExistingConnection, 500);
  }, []);

  const connectPhantomDirectly = async (): Promise<boolean> => {
    if (!isWeb || typeof window === 'undefined') {
      console.log('Not in web environment');
      return false;
    }

    try {
      const { solana } = window as any;
      console.log('Window.solana:', solana);
      console.log('Is Phantom:', solana?.isPhantom);
      
      if (!solana?.isPhantom) {
        console.log('Phantom not detected in window.solana');
        return false;
      }

      console.log('Phantom detected, attempting direct connection...');
      
      // Request connection - this should open the Phantom popup
      const response = await solana.connect();
      console.log('Phantom connection response:', response);
      console.log('Phantom connected! Public key:', response.publicKey.toString());

      setConnected(true);
      setPublicKey(response.publicKey); // Store the actual PublicKey object
      return true;
    } catch (error: any) {
      console.error('Direct Phantom connection failed:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      return false;
    }
  };

  const connect = async () => {
    setConnecting(true);
    const success = await connectPhantomDirectly();
    setConnecting(false);

    if (!success) {
      console.log('Direct connection failed, you may need to refresh and try again');
    }
  };

  const disconnect = async () => {
    if (isWeb && typeof window !== 'undefined') {
      try {
        const { solana } = window as any;
        if (solana?.disconnect) {
          await solana.disconnect();
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    setConnected(false);
    setPublicKey(null);
  };

  const signAndSendTransaction = async (transaction: any): Promise<string> => {
    if (!isWeb || typeof window === 'undefined') {
      throw new Error('Not on web platform');
    }

    if (!connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const { solana } = window as any;
      const { signature } = await solana.signAndSendTransaction(transaction);
      return signature;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    connected,
    publicKey,
    connecting,
    connect,
    disconnect,
    signAndSendTransaction,
    connection,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Mobile Wallet Provider using deep linking
 */
function MobileWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<any>(null);

  // Create Solana connection on mount with free public RPC
  useEffect(() => {
    const createConnection = async () => {
      try {
        const { Connection } = await import('@solana/web3.js');
        // Use Ankr RPC (free, no API key required)
        const conn = new Connection(PRIMARY_RPC, 'confirmed');
        setConnection(conn);
        console.log('Mobile Solana connection created (Ankr RPC)');
      } catch (error) {
        console.error('Failed to create mobile Solana connection:', error);
      }
    };

    createConnection();
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const Linking = await import('expo-linking');

      const redirectUrl = Linking.createURL('phantom-connect');
      const phantomConnectUrl = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent('https://lolstone.com')}&redirect_link=${encodeURIComponent(redirectUrl)}`;

      await Linking.openURL(phantomConnectUrl);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setConnected(false);
    setPublicKey(null);
  };

  const signAndSendTransaction = async (transaction: any): Promise<string> => {
    throw new Error('Mobile transaction signing not implemented');
  };

  const value: WalletContextType = {
    connected,
    publicKey,
    connecting,
    connect,
    disconnect,
    signAndSendTransaction,
    connection,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Main Wallet Provider
 */
export function WalletContextProvider({ children }: { children: ReactNode }) {
  if (isWeb) {
    return <WebWalletProvider>{children}</WebWalletProvider>;
  }
  return <MobileWalletProvider>{children}</MobileWalletProvider>;
}

export default WalletContext;

