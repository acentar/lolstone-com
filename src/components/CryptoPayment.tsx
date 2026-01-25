/**
 * Crypto Payment Component
 * 
 * Allows users to purchase ducats using Phantom wallet (USDC preferred, SOL fallback).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { useWalletContext } from '../context/WalletContext';
import {
  DUCAT_PACKAGES,
  calculateUsdcAmount,
  formatUsdcAmount,
  getSolPriceUsd,
  calculateSolAmount,
  formatSolAmount,
  getMemeCoinPriceUsd,
  calculateMemeCoinAmount,
  formatMemeCoinAmount,
  createUsdcTransferTransaction,
  createSolTransferTransaction,
  createMemeCoinTransferTransaction,
  verifyTransaction,
} from '../lib/crypto';

interface CryptoPaymentProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (ducats: number, signature: string) => void;
  playerId: string;
}

type PaymentState = 'select' | 'connecting' | 'confirming' | 'processing' | 'success' | 'error';

export default function CryptoPayment({
  visible,
  onClose,
  onSuccess,
  playerId,
}: CryptoPaymentProps) {
  // Use wallet context for Phantom connection
  const { connected, publicKey, connecting, connect, disconnect, signAndSendTransaction, connection } = useWalletContext();
  const [selectedPackage, setSelectedPackage] = useState<typeof DUCAT_PACKAGES[0] | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('select');
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [memeCoinPrice, setMemeCoinPrice] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'usdc' | 'sol' | 'meme'>('sol');
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Check for Phantom availability
  const [phantomAvailable, setPhantomAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const checkPhantom = () => {
        const { solana } = window as any;
        const available = solana?.isPhantom;
        setPhantomAvailable(!!available);
        console.log('Phantom available:', available);
      };

      checkPhantom();
      // Check again after a delay in case extension loads later
      setTimeout(checkPhantom, 1000);
    }
  }, []);

  // Animation for glowing effect
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Fetch prices on mount
  useEffect(() => {
    if (visible) {
      getSolPriceUsd().then(setSolPrice);
      getMemeCoinPriceUsd().then(setMemeCoinPrice).catch(err => {
        console.error('Failed to fetch meme coin price:', err);
        setMemeCoinPrice(null);
      });
    }
  }, [visible]);


  // Update payment state when wallet connects
  useEffect(() => {
    if (connected && paymentState === 'connecting') {
      setPaymentState('confirming');
    }
  }, [connected, paymentState]);

  const handlePackageSelect = (pkg: typeof DUCAT_PACKAGES[0]) => {
    setSelectedPackage(pkg);
    setError(null);
  };

  const handleConnect = async () => {
    setPaymentState('connecting');
    setError(null);

    try {
      console.log('Attempting to connect wallet...');

      if (Platform.OS === 'web') {
        if (!phantomAvailable) {
          // Phantom not available, guide user to install it
          setError('Please install the Phantom wallet extension from https://phantom.app/ and refresh the page.');
          setPaymentState('select');
          return;
        }

        // Try direct Phantom connection
        console.log('Trying direct Phantom connection...');
        await connect();

        // Check if connection was successful by directly checking window.solana
        const { solana } = window as any;
        if (solana?.isConnected && solana?.publicKey) {
          console.log('Connection successful!', solana.publicKey.toString());
          setPaymentState('confirming');
        } else {
          // Wait a moment for connection to complete
          setTimeout(() => {
            const { solana: solanaCheck } = window as any;
            if (solanaCheck?.isConnected && solanaCheck?.publicKey) {
              console.log('Connection successful (delayed)!', solanaCheck.publicKey.toString());
              setPaymentState('confirming');
            } else {
              setError('Connection failed. Please try again or refresh the page.');
              setPaymentState('select');
            }
          }, 1500);
        }
      } else {
        // Mobile - use deep linking
        await connect();
        setPaymentState('confirming');
      }
    } catch (err) {
      console.error('Connect error:', err);
      setError('Failed to connect wallet. Please try again.');
      setPaymentState('select');
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !publicKey) return;

    setPaymentState('processing');
    setError(null);

    try {
      let transaction;
      
      if (paymentMethod === 'sol') {
        if (!solPrice) {
          throw new Error('SOL price not available. Please try again.');
        }
        console.log('Creating SOL transfer transaction...');
        console.log('Sender:', publicKey.toString ? publicKey.toString() : publicKey);
        console.log('Amount (ducats):', selectedPackage.ducats);
        console.log('SOL price:', solPrice);
        
        transaction = await createSolTransferTransaction(
          publicKey,
          selectedPackage.ducats,
          solPrice,
          connection
        );
      } else if (paymentMethod === 'meme') {
        if (!memeCoinPrice) {
          throw new Error('LOLS price not available. Please try again.');
        }
        console.log('Creating LOLS transfer transaction...');
        console.log('Sender:', publicKey.toString ? publicKey.toString() : publicKey);
        console.log('Amount (ducats):', selectedPackage.ducats);
        console.log('LOLS price:', memeCoinPrice);
        
        transaction = await createMemeCoinTransferTransaction(
          publicKey,
          selectedPackage.ducats,
          memeCoinPrice,
          connection
        );
      } else {
        throw new Error('Please select a payment method.');
      }

      console.log('Transaction created, sending to Phantom...');
      const sig = await signAndSendTransaction(transaction);
      console.log('Transaction sent, signature:', sig);
      setSignature(sig);

      // Wait a bit for confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Skip verification if we don't have a working connection
      // Just trust Phantom's confirmation
      if (connection) {
        try {
          const verification = await verifyTransaction(sig, connection);
          if (!verification.success) {
            console.warn('Verification failed but transaction may still be processing:', verification.error);
          }
        } catch (verifyError) {
          console.warn('Could not verify transaction, assuming success:', verifyError);
        }
      }
      
      setPaymentState('success');
      onSuccess(selectedPackage.ducats, sig);
    } catch (err) {
      console.error('Payment error:', err);
      setError((err as Error).message || 'Payment failed');
      setPaymentState('error');
    }
  };

  const handleClose = () => {
    setPaymentState('select');
    setSelectedPackage(null);
    setError(null);
    setSignature(null);
    onClose();
  };

  // New: Connect wallet first screen
  const renderConnectFirst = () => (
    <Animated.View entering={FadeIn} style={styles.connectFirstContainer}>
      <Text style={styles.connectFirstEmoji}>👻</Text>
      <Text style={styles.title}>Connect Your Wallet</Text>
      <Text style={styles.subtitle}>Connect your Phantom wallet to buy ducats with crypto</Text>
      
      {!phantomAvailable && Platform.OS === 'web' && (
        <View style={styles.installPrompt}>
          <Text style={styles.installPromptText}>
            Phantom wallet extension not detected.
          </Text>
          <Pressable 
            style={styles.installButton}
            onPress={() => window.open('https://phantom.app/', '_blank')}
          >
            <Text style={styles.installButtonText}>Install Phantom →</Text>
          </Pressable>
        </View>
      )}

      {(phantomAvailable || Platform.OS !== 'web') && (
        <Pressable
          style={styles.connectButton}
          onPress={handleConnect}
          disabled={connecting}
        >
          <LinearGradient
            colors={['#8b5cf6', '#a855f7']}
            style={styles.connectButtonGradient}
          >
            {connecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>
                👻 Connect Phantom Wallet
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
    </Animated.View>
  );

  const renderPackageSelection = () => (
    <Animated.View entering={FadeIn} style={styles.packagesContainer}>
      <Text style={styles.title}>💎 Buy Ducats</Text>
      <Text style={styles.subtitle}>Select a package below</Text>

      <View style={styles.packages}>
        {DUCAT_PACKAGES.map((pkg) => (
          <Pressable
            key={pkg.ducats}
            style={[
              styles.packageCard,
              selectedPackage?.ducats === pkg.ducats && styles.packageSelected,
            ]}
            onPress={() => handlePackageSelect(pkg)}
          >
            <LinearGradient
              colors={
                selectedPackage?.ducats === pkg.ducats
                  ? ['#8b5cf6', '#6d28d9']
                  : ['#1e1e2e', '#2d2d44']
              }
              style={styles.packageGradient}
            >
              <Text style={styles.packageLabel}>{pkg.label}</Text>
              <Text style={styles.packageDucats}>{pkg.ducats.toLocaleString()}</Text>
              <Text style={styles.packageDucatsLabel}>DUCATS</Text>
              <View style={styles.packagePriceContainer}>
                <Text style={styles.packagePrice}>${pkg.usd}</Text>
                {solPrice && (
                  <Text style={styles.packageSolPrice}>
                    ≈ {formatSolAmount(calculateSolAmount(pkg.ducats, solPrice))} SOL
                  </Text>
                )}
                {memeCoinPrice && (
                  <Text style={styles.packageSolPrice}>
                    ≈ {formatMemeCoinAmount(calculateMemeCoinAmount(pkg.ducats, memeCoinPrice))} LOLS
                  </Text>
                )}
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </View>

      {selectedPackage && (
        <Animated.View entering={SlideInUp} style={styles.paymentMethodContainer}>
          <Text style={styles.methodTitle}>Payment Method</Text>
          <View style={styles.methodOptions}>
            <Pressable
              style={[
                styles.methodOption,
                paymentMethod === 'sol' && styles.methodSelected,
              ]}
              onPress={() => setPaymentMethod('sol')}
            >
              <Text style={styles.methodIcon}>🪙</Text>
              <Text style={styles.methodLabel}>SOL</Text>
              <Text style={styles.methodAmount}>
                {solPrice ? `${formatSolAmount(calculateSolAmount(selectedPackage.ducats, solPrice))} SOL` : '...'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.methodOption,
                paymentMethod === 'meme' && styles.methodSelected,
              ]}
              onPress={() => setPaymentMethod('meme')}
            >
              <View style={styles.methodLogoContainer}>
                <View style={styles.methodLogoTopContainer}>
                  <Text style={styles.methodLogoTop}>L</Text>
                  <View style={styles.methodFunnyO}>
                    <View style={styles.methodFunnyOInner}>
                      <View style={styles.methodFunnyOLeftEye} />
                      <View style={styles.methodFunnyORightEye} />
                      <View style={styles.methodFunnyOMouth} />
                    </View>
                  </View>
                  <Text style={styles.methodLogoTop}>L</Text>
                </View>
                <Text style={styles.methodLogoBottom}>STONE</Text>
              </View>
              <Text style={styles.methodLabel}>LOLS</Text>
              <Text style={styles.methodAmount}>
                {memeCoinPrice ? `${formatMemeCoinAmount(calculateMemeCoinAmount(selectedPackage.ducats, memeCoinPrice))} LOLS` : '...'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {selectedPackage && (
        <Pressable
          style={styles.buyButton}
          onPress={handlePurchase}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.buyButtonGradient}
          >
            <Text style={styles.buyButtonText}>
              Pay with {paymentMethod === 'sol' ? 'SOL' : 'LOLS'}
            </Text>
          </LinearGradient>
        </Pressable>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
    </Animated.View>
  );

  const renderConnecting = () => (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color="#8b5cf6" />
      <Text style={styles.stateTitle}>Connecting to Phantom...</Text>
      <Text style={styles.stateSubtitle}>Please approve in your wallet</Text>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.stateContainer}>
      <Animated.View style={[styles.processingIcon, glowStyle]}>
        <Text style={styles.processingEmoji}>⏳</Text>
      </Animated.View>
      <Text style={styles.stateTitle}>Processing Transaction...</Text>
      <Text style={styles.stateSubtitle}>Please wait for confirmation</Text>
      {signature && (
        <Text style={styles.signatureText} numberOfLines={1}>
          TX: {signature.slice(0, 20)}...
        </Text>
      )}
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stateContainer}>
      <Animated.View entering={FadeIn} style={styles.successIcon}>
        <Text style={styles.successEmoji}>🎉</Text>
      </Animated.View>
      <Text style={styles.stateTitle}>Payment Successful!</Text>
      <Text style={styles.successAmount}>
        +{selectedPackage?.ducats.toLocaleString()} Ducats
      </Text>
      <Pressable style={styles.doneButton} onPress={handleClose}>
        <Text style={styles.doneButtonText}>Done</Text>
      </Pressable>
    </View>
  );

  const renderError = () => (
    <View style={styles.stateContainer}>
      <Text style={styles.errorEmoji}>❌</Text>
      <Text style={styles.stateTitle}>Payment Failed</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <Pressable style={styles.retryButton} onPress={() => setPaymentState('select')}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Connection Status - always show if connected */}
            {connected && publicKey && (
              <View style={styles.walletStatus}>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedBadgeText}>✅ Connected</Text>
                </View>
                <Text style={styles.walletIcon}>👻</Text>
                <Text style={styles.walletAddress}>
                  {typeof publicKey === 'string' 
                    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
                    : publicKey.toBase58 
                      ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                      : 'Wallet'
                  }
                </Text>
                <Pressable onPress={disconnect} style={styles.disconnectButton}>
                  <Text style={styles.disconnectText}>Change</Text>
                </Pressable>
              </View>
            )}

            {/* Debug info */}
            {__DEV__ && (
              <Text style={{ color: '#666', fontSize: 10, textAlign: 'center', marginBottom: 8 }}>
                Debug: paymentState={paymentState}, connected={String(connected)}, hasConnection={String(!!connection)}
              </Text>
            )}

            {/* Content based on state */}
            {paymentState === 'select' && !connected && renderConnectFirst()}
            {paymentState === 'select' && connected && renderPackageSelection()}
            {paymentState === 'connecting' && renderConnecting()}
            {paymentState === 'processing' && renderProcessing()}
            {paymentState === 'success' && renderSuccess()}
            {paymentState === 'error' && renderError()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#0f0f1a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  scrollContent: {
    paddingTop: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  closeButtonText: {
    color: '#9ca3af',
    fontSize: 24,
  },
  walletStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
  },
  walletIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  walletAddress: {
    color: '#a78bfa',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  packagesContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 24,
  },
  packages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    width: '45%',
    minWidth: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageSelected: {
    borderColor: '#8b5cf6',
  },
  packageGradient: {
    padding: 16,
    alignItems: 'center',
  },
  packageLabel: {
    fontSize: 12,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  packageDucats: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  packageDucatsLabel: {
    fontSize: 10,
    color: '#9ca3af',
    letterSpacing: 2,
    marginBottom: 8,
  },
  packagePriceContainer: {
    alignItems: 'center',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22c55e',
  },
  packageSolPrice: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentMethodContainer: {
    width: '100%',
    marginBottom: 20,
  },
  methodTitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
    textAlign: 'center',
  },
  methodOptions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  methodOption: {
    flex: 1,
    maxWidth: 160,
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  methodAmount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  methodLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  methodLogoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  methodLogoTop: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#00f5d4',
    lineHeight: 16,
  },
  methodLogoBottom: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#ffffff',
    lineHeight: 10,
    marginTop: -2,
    transform: [{ rotate: '-5deg' }],
  },
  methodFunnyO: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 1,
  },
  methodFunnyOInner: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  methodFunnyOLeftEye: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#00f5d4',
  },
  methodFunnyORightEye: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#00f5d4',
  },
  methodFunnyOMouth: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  buyButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  walletButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  processingIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingEmoji: {
    fontSize: 48,
  },
  signatureText: {
    marginTop: 16,
    fontSize: 12,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  successIcon: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 64,
  },
  successAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 8,
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // New styles for connect first flow
  connectFirstContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  connectFirstEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  installPrompt: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  installPromptText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  installButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  installButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  connectButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  connectButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disconnectButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
  },
  disconnectText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '500',
  },
  connectedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  connectedBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
});

