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
  createUsdcTransferTransaction,
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
  const { connected, publicKey, connecting, connect, signAndSendTransaction, connection } = useWalletContext();
  const [walletButtonLoaded, setWalletButtonLoaded] = useState(false);
  const [WalletButtonComponent, setWalletButtonComponent] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<typeof DUCAT_PACKAGES[0] | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('select');
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'usdc' | 'sol'>('usdc');
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

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

  // Fetch SOL price on mount
  useEffect(() => {
    if (visible) {
      getSolPriceUsd().then(setSolPrice);
    }
  }, [visible]);

  // Load WalletMultiButton for web
  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      import('@solana/wallet-adapter-react-ui').then(module => {
        setWalletButtonComponent(() => module.WalletMultiButton);
        setWalletButtonLoaded(true);
      }).catch(err => {
        console.log('WalletMultiButton not available:', err);
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
    try {
      console.log('Attempting to connect wallet...');
      await connect();
      console.log('Connect function completed, checking connection status...');
      // Check if we're now connected
      if (connected) {
        setPaymentState('confirming');
      } else {
        // If not connected yet, wait a bit and check again
        setTimeout(() => {
          if (connected) {
            setPaymentState('confirming');
          } else {
            setError('Please complete wallet connection in the popup');
            setPaymentState('select');
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Connect error:', err);
      setError('Failed to connect wallet');
      setPaymentState('select');
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !publicKey || !connection) return;

    setPaymentState('processing');
    setError(null);

    try {
      // Create and send transaction
      const transaction = await createUsdcTransferTransaction(
        publicKey,
        selectedPackage.ducats,
        connection
      );

      const sig = await signAndSendTransaction(transaction);
      setSignature(sig);

      // Wait a bit for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify transaction
      const verification = await verifyTransaction(sig);
      
      if (verification.success) {
        setPaymentState('success');
        onSuccess(selectedPackage.ducats, sig);
      } else {
        throw new Error(verification.error || 'Transaction verification failed');
      }
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

  const renderPackageSelection = () => (
    <Animated.View entering={FadeIn} style={styles.packagesContainer}>
      <Text style={styles.title}>💎 Buy Ducats</Text>
      <Text style={styles.subtitle}>Pay with crypto via Phantom</Text>

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
              style={[styles.methodOption, paymentMethod === 'usdc' && styles.methodSelected]}
              onPress={() => setPaymentMethod('usdc')}
            >
              <Text style={styles.methodIcon}>💵</Text>
              <Text style={styles.methodLabel}>USDC</Text>
              <Text style={styles.methodAmount}>
                ${selectedPackage.usd.toFixed(2)}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.methodOption, paymentMethod === 'sol' && styles.methodSelected]}
              onPress={() => setPaymentMethod('sol')}
            >
              <Text style={styles.methodIcon}>◎</Text>
              <Text style={styles.methodLabel}>SOL</Text>
              <Text style={styles.methodAmount}>
                {solPrice ? formatSolAmount(calculateSolAmount(selectedPackage.ducats, solPrice)) : '...'} SOL
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {selectedPackage && (
        connected ? (
          <Pressable
            style={styles.buyButton}
            onPress={handlePurchase}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.buyButtonGradient}
            >
              <Text style={styles.buyButtonText}>
                🔐 Confirm Purchase
              </Text>
            </LinearGradient>
          </Pressable>
        ) : Platform.OS === 'web' && WalletButtonComponent && walletButtonLoaded ? (
          <View style={styles.walletButtonContainer}>
            <WalletButtonComponent />
          </View>
        ) : (
          <Pressable
            style={styles.buyButton}
            onPress={handleConnect}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.buyButtonGradient}
            >
              <Text style={styles.buyButtonText}>
                👻 Connect Phantom
              </Text>
            </LinearGradient>
          </Pressable>
        )
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

          {/* Connection Status */}
          {connected && publicKey && (
            <View style={styles.walletStatus}>
              <Text style={styles.walletIcon}>👻</Text>
              <Text style={styles.walletAddress}>
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </Text>
            </View>
          )}

          {/* Content based on state */}
          {paymentState === 'select' && renderPackageSelection()}
          {paymentState === 'connecting' && renderConnecting()}
          {paymentState === 'processing' && renderProcessing()}
          {paymentState === 'success' && renderSuccess()}
          {paymentState === 'error' && renderError()}
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
});

