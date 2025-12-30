/**
 * Wallet Context for Solana/Phantom Integration
 *
 * Provides wallet connection and transaction capabilities for both web and mobile.
 * Web: Uses @solana/wallet-adapter
 * Mobile: Uses deep linking to Phantom app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Platform } from 'react-native';

// Only import wallet adapter on web
let WalletAdapterNetwork: any;
let useWallet: any;
let useConnection: any;
let ConnectionProvider: any;
let WalletProvider: any;
let WalletModalProvider: any;
let PhantomWalletAdapter: any;

// Check if we're on web and dynamically import wallet adapter
const isWeb = Platform.OS === 'web';

interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
  connection: Connection | null;
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
 * Web Wallet Provider using @solana/wallet-adapter
 */
function WebWalletProvider({ children }: { children: ReactNode }) {
  const [WalletComponents, setWalletComponents] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamically import wallet adapter components on web only
    async function loadWalletAdapter() {
      try {
        const [
          walletAdapterReact,
          walletAdapterWallets,
          walletAdapterReactUi,
        ] = await Promise.all([
          import('@solana/wallet-adapter-react'),
          import('@solana/wallet-adapter-wallets'),
          import('@solana/wallet-adapter-react-ui'),
          import('@solana/web3.js'), // Also import web3 for clusterApiUrl
        ]);

        // Import CSS for wallet modal (web only)
        console.log('Loading wallet adapter CSS...');
        await import('@solana/wallet-adapter-react-ui/styles.css');

        // Store web3 for later use
        console.log('Loading web3.js...');
        const web3 = await import('@solana/web3.js');

        setWalletComponents({
          ConnectionProvider: walletAdapterReact.ConnectionProvider,
          WalletProvider: walletAdapterReact.WalletProvider,
          useWallet: walletAdapterReact.useWallet,
          useConnection: walletAdapterReact.useConnection,
          useWalletModal: walletAdapterReactUi.useWalletModal,
          WalletModalProvider: walletAdapterReactUi.WalletModalProvider,
          WalletMultiButton: walletAdapterReactUi.WalletMultiButton,
          PhantomWalletAdapter: walletAdapterWallets.PhantomWalletAdapter,
          SolflareWalletAdapter: walletAdapterWallets.SolflareWalletAdapter,
          clusterApiUrl: web3.clusterApiUrl,
        });
      } catch (error) {
        console.error('Failed to load wallet adapter:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWalletAdapter();
  }, []);

  if (isLoading || !WalletComponents) {
    return <>{children}</>;
  }

  const { ConnectionProvider, WalletProvider, WalletModalProvider, PhantomWalletAdapter, SolflareWalletAdapter, clusterApiUrl } = WalletComponents;

  const endpoint = clusterApiUrl('mainnet-beta');

  // Include multiple wallets for better detection
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  console.log('Setting up wallet provider with', wallets.length, 'wallets');
  console.log('Wallets:', wallets.map(w => w.name));

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WebWalletContextBridge WalletComponents={WalletComponents}>
            {children}
          </WebWalletContextBridge>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/**
 * Bridges the wallet adapter hooks to our context
 */
function WebWalletContextBridge({
  children,
  WalletComponents
}: {
  children: ReactNode;
  WalletComponents: any;
}) {
  const { useWallet, useConnection, useWalletModal } = WalletComponents;
  const wallet = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  // Debug wallet state
  console.log('Wallet state:', {
    connected: wallet.connected,
    connecting: wallet.connecting,
    publicKey: wallet.publicKey?.toString(),
    wallets: wallet.wallets?.length || 0,
  });

  const value: WalletContextType = {
    connected: wallet.connected,
    publicKey: wallet.publicKey,
    connecting: wallet.connecting,
    connect: () => {
      console.log('Opening wallet modal...');
      console.log('Available wallets:', wallet.wallets?.length);

      // Try to open modal, but also log available wallets
      if (wallet.wallets && wallet.wallets.length > 0) {
        console.log('Available wallets:', wallet.wallets.map(w => w.adapter.name));
        setVisible(true);
      } else {
        console.log('No wallets detected, trying to open modal anyway');
        setVisible(true);
      }
      return Promise.resolve();
    },
    disconnect: wallet.disconnect,
    signAndSendTransaction: async (transaction: Transaction) => {
      if (!wallet.signTransaction || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      const signature = await wallet.sendTransaction(transaction, connection);
      return signature;
    },
    connection,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Mobile Wallet Provider using Phantom deep links
 */
function MobileWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<any>(null);

  const connect = async () => {
    setConnecting(true);
    try {
      // Load Solana libraries dynamically
      const { Connection, clusterApiUrl } = await import('@solana/web3.js');
      const conn = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
      setConnection(conn);

      // For mobile, we'll use deep linking to Phantom
      // This is a simplified version - full implementation would use @solana/wallet-standard
      const Linking = await import('expo-linking');

      // Create Phantom connect URL
      const redirectUrl = Linking.createURL('phantom-connect');
      const phantomConnectUrl = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent('https://lolstone.com')}&redirect_link=${encodeURIComponent(redirectUrl)}`;

      await Linking.openURL(phantomConnectUrl);

      // Note: Full implementation would handle the callback with the public key
      // For now, we'll show a placeholder
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
    // For mobile, we'd serialize the transaction and send via deep link
    throw new Error('Mobile transaction signing not yet implemented');
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
 * Main Wallet Provider - uses web or mobile implementation based on platform
 */
export function WalletContextProvider({ children }: { children: ReactNode }) {
  if (isWeb) {
    return <WebWalletProvider>{children}</WebWalletProvider>;
  }
  return <MobileWalletProvider>{children}</MobileWalletProvider>;
}

export default WalletContext;

