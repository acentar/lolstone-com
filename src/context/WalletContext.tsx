/**
 * Wallet Context for Solana/Phantom Integration
 *
 * Provides wallet connection and transaction capabilities for both web and mobile.
 * Web: Uses direct Phantom connection (no wallet adapter)
 * Mobile: Uses deep linking to Phantom app
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
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
 */
function WebWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

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
    connection: null, // Not used for direct connection
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
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

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
    connection: null,
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

