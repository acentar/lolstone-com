import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { colors, spacing } from '../src/constants/theme';

export default function BrandingPage() {
  const router = useRouter();

  // Logo animation values
  const funnyOAnimation = useSharedValue(0);

  // Animated styles for funny O
  const funnyOAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(funnyOAnimation.value, [0, 1], [1, 1.05]) },
      { rotate: `${interpolate(funnyOAnimation.value, [0, 1], [0, 5])}deg` },
    ],
  }));

  // Start logo animations
  useEffect(() => {
    funnyOAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <Pressable style={styles.logoButton} onPress={() => router.push('/')}>
              <View style={styles.headerLogoContainer}>
                <View style={styles.headerLogoTopContainer}>
                  <Text style={styles.headerLogoTopText}>L</Text>
                  <View style={styles.headerFunnyOContainer}>
                    <View style={styles.headerFunnyO}>
                      <View style={styles.headerFunnyOInner}>
                        <View style={styles.headerFunnyOLeftEye} />
                        <View style={styles.headerFunnyORightEye} />
                        <View style={styles.headerFunnyOMouth} />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.headerLogoTopText}>L</Text>
                </View>
                <Text style={styles.headerLogoBottomText}>STONE</Text>
              </View>
            </Pressable>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.pageTitle}>Brand Guidelines</Text>
          <Text style={styles.pageSubtitle}>Logo usage, colors, and assets</Text>
        </View>

        {/* Main Logo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Logo</Text>
          <Text style={styles.sectionDescription}>
            The LOLSTONE logo uses a two-tone design with animated glow effect.
          </Text>
          
          <View style={styles.logoShowcase}>
            {/* Stacked Logo */}
            <View style={styles.stackedLogoContainer}>
              <View style={styles.logoTopContainer}>
                <Text style={styles.logoTop}>L</Text>
                <Animated.View style={[styles.funnyOContainer, funnyOAnimatedStyle]}>
                  <View style={styles.funnyO}>
                    <View style={styles.funnyOInner}>
                      <View style={styles.funnyOLeftEye} />
                      <View style={styles.funnyORightEye} />
                      <View style={styles.funnyOMouth} />
                    </View>
                  </View>
                </Animated.View>
                <Text style={styles.logoTop}>L</Text>
              </View>
              <Text style={styles.logoBottom}>STONE</Text>
            </View>
          </View>

          {/* Logo Variations */}
          <View style={styles.variationsGrid}>
            <View style={styles.variationCard}>
              <Text style={styles.variationLabel}>Light Background</Text>
              <View style={[styles.variationPreview, { backgroundColor: '#ffffff' }]}>
                <View style={styles.stackedLogoContainer}>
                  <View style={styles.logoTopContainer}>
                    <Text style={[styles.logoTop, { color: '#00f5d4' }]}>L</Text>
                    <View style={styles.funnyOContainer}>
                      <View style={styles.funnyO}>
                        <View style={styles.funnyOInner}>
                          <View style={[styles.funnyOLeftEye, { backgroundColor: '#00f5d4' }]} />
                          <View style={[styles.funnyORightEye, { backgroundColor: '#00f5d4' }]} />
                          <View style={[styles.funnyOMouth, { borderBottomColor: '#00f5d4' }]} />
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.logoTop, { color: '#00f5d4' }]}>L</Text>
                  </View>
                  <Text style={[styles.logoBottom, { color: '#0a0a0f' }]}>STONE</Text>
                </View>
              </View>
            </View>

            <View style={styles.variationCard}>
              <Text style={styles.variationLabel}>Dark Background</Text>
              <View style={[styles.variationPreview, { backgroundColor: '#0a0a0f' }]}>
                <View style={styles.stackedLogoContainer}>
                  <View style={styles.logoTopContainer}>
                    <Text style={styles.logoTop}>L</Text>
                    <View style={styles.funnyOContainer}>
                      <View style={styles.funnyO}>
                        <View style={styles.funnyOInner}>
                          <View style={styles.funnyOLeftEye} />
                          <View style={styles.funnyORightEye} />
                          <View style={styles.funnyOMouth} />
                        </View>
                      </View>
                    </View>
                    <Text style={styles.logoTop}>L</Text>
                  </View>
                  <Text style={styles.logoBottom}>STONE</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Social Media Avatar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media Avatar</Text>
          <Text style={styles.sectionDescription}>
            Square format optimized for profile pictures on Twitter, Discord, Instagram, etc.
          </Text>
          
          <Text style={styles.subsectionTitle}>Dark Background</Text>
          <View style={styles.avatarShowcase}>
            {[128].map((size) => (
              <View key={`dark-${size}`} style={styles.avatarItem}>
                <View style={[styles.avatarContainer, { width: size, height: size }]}>
                  <LinearGradient
                    colors={['#0a0a0f', '#1e293b']}
                    style={[styles.avatarGradient, { width: size, height: size, borderRadius: 0 }]}
                  >
                    <View style={styles.avatarLogoContainer}>
                      <View style={styles.avatarLogoTopContainer}>
                        <Text style={[styles.avatarLogoTop, { fontSize: size * 0.25 }]}>L</Text>
                        <View style={[styles.avatarFunnyO, { 
                          width: size * 0.3, 
                          height: size * 0.3,
                          borderRadius: size * 0.15,
                          borderWidth: size * 0.03,
                        }]}>
                          <View style={[styles.avatarFunnyOInner, { 
                            width: size * 0.22, 
                            height: size * 0.22 
                          }]}>
                            <View style={[styles.avatarFunnyOLeftEye, { 
                              width: size * 0.03, 
                              height: size * 0.03,
                              borderRadius: size * 0.015,
                              top: size * 0.05,
                              left: size * 0.05,
                            }]} />
                            <View style={[styles.avatarFunnyORightEye, { 
                              width: size * 0.03, 
                              height: size * 0.03,
                              borderRadius: size * 0.015,
                              top: size * 0.05,
                              right: size * 0.05,
                            }]} />
                            <View style={[styles.avatarFunnyOMouth, { 
                              width: size * 0.1,
                              height: size * 0.06,
                              borderBottomWidth: size * 0.015,
                              bottom: size * 0.05,
                            }]} />
                          </View>
                        </View>
                        <Text style={[styles.avatarLogoTop, { fontSize: size * 0.25 }]}>L</Text>
                      </View>
                      <Text style={[styles.avatarLogoBottom, { fontSize: size * 0.18 }]}>STONE</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.avatarSizeLabel}>{size}x{size}px</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.subsectionTitle, { marginTop: spacing.xl }]}>White Background</Text>
          <View style={styles.avatarShowcase}>
            {[128].map((size) => (
              <View key={`light-${size}`} style={styles.avatarItem}>
                <View style={[styles.avatarContainer, { width: size, height: size }]}>
                  <View style={[styles.avatarLightBackground, { 
                    width: size, 
                    height: size, 
                    borderRadius: 0,
                    backgroundColor: '#ffffff',
                  }]}>
                    <View style={styles.avatarLogoContainer}>
                      <View style={styles.avatarLogoTopContainer}>
                        <Text style={[styles.avatarLogoTop, { 
                          fontSize: size * 0.25,
                          color: '#00f5d4',
                        }]}>L</Text>
                        <View style={[styles.avatarFunnyO, { 
                          width: size * 0.3, 
                          height: size * 0.3,
                          borderRadius: size * 0.15,
                          borderWidth: size * 0.03,
                          borderColor: '#00f5d4',
                        }]}>
                          <View style={[styles.avatarFunnyOInner, { 
                            width: size * 0.22, 
                            height: size * 0.22 
                          }]}>
                            <View style={[styles.avatarFunnyOLeftEye, { 
                              width: size * 0.03, 
                              height: size * 0.03,
                              borderRadius: size * 0.015,
                              top: size * 0.05,
                              left: size * 0.05,
                              backgroundColor: '#00f5d4',
                            }]} />
                            <View style={[styles.avatarFunnyORightEye, { 
                              width: size * 0.03, 
                              height: size * 0.03,
                              borderRadius: size * 0.015,
                              top: size * 0.05,
                              right: size * 0.05,
                              backgroundColor: '#00f5d4',
                            }]} />
                            <View style={[styles.avatarFunnyOMouth, { 
                              width: size * 0.1,
                              height: size * 0.06,
                              borderBottomWidth: size * 0.015,
                              borderBottomColor: '#00f5d4',
                              bottom: size * 0.05,
                            }]} />
                          </View>
                        </View>
                        <Text style={[styles.avatarLogoTop, { 
                          fontSize: size * 0.25,
                          color: '#00f5d4',
                        }]}>L</Text>
                      </View>
                      <Text style={[styles.avatarLogoBottom, { 
                        fontSize: size * 0.18,
                        color: '#0a0a0f',
                      }]}>STONE</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.avatarSizeLabel}>{size}x{size}px</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Website Header Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Website Header</Text>
          <Text style={styles.sectionDescription}>
            How the logo appears in website navigation bars.
          </Text>
          
          <View style={styles.headerExample}>
            <View style={styles.headerExampleBar}>
              <View style={styles.headerExampleContent}>
                <View style={styles.headerLogoContainer}>
                  <View style={styles.headerLogoTopContainer}>
                    <Text style={styles.headerLogoTopText}>L</Text>
                    <View style={styles.headerFunnyOContainer}>
                      <View style={styles.headerFunnyO}>
                        <View style={styles.headerFunnyOInner}>
                          <View style={styles.headerFunnyOLeftEye} />
                          <View style={styles.headerFunnyORightEye} />
                          <View style={styles.headerFunnyOMouth} />
                        </View>
                      </View>
                    </View>
                    <Text style={styles.headerLogoTopText}>L</Text>
                  </View>
                  <Text style={styles.headerLogoBottomText}>STONE</Text>
                </View>
                <View style={styles.headerExampleNav}>
                  <Text style={styles.headerNavItem}>Home</Text>
                  <Text style={styles.headerNavItem}>Cards</Text>
                  <Text style={styles.headerNavItem}>Play</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.headerExample}>
            <View style={[styles.headerExampleBar, { backgroundColor: '#ffffff' }]}>
              <View style={styles.headerExampleContent}>
                <View style={styles.headerLogoContainer}>
                  <View style={styles.headerLogoTopContainer}>
                    <Text style={[styles.headerLogoTopText, { color: '#00f5d4' }]}>L</Text>
                    <View style={styles.headerFunnyOContainer}>
                      <View style={styles.headerFunnyO}>
                        <View style={styles.headerFunnyOInner}>
                          <View style={styles.headerFunnyOLeftEye} />
                          <View style={styles.headerFunnyORightEye} />
                          <View style={styles.headerFunnyOMouth} />
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.headerLogoTopText, { color: '#00f5d4' }]}>L</Text>
                  </View>
                  <Text style={[styles.headerLogoBottomText, { color: '#0a0a0f' }]}>STONE</Text>
                </View>
                <View style={styles.headerExampleNav}>
                  <Text style={[styles.headerNavItem, { color: '#0a0a0f' }]}>Home</Text>
                  <Text style={[styles.headerNavItem, { color: '#0a0a0f' }]}>Cards</Text>
                  <Text style={[styles.headerNavItem, { color: '#0a0a0f' }]}>Play</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Favicon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favicon</Text>
          <Text style={styles.sectionDescription}>
            Browser tab icon in various sizes.
          </Text>
          
          <View style={styles.faviconShowcase}>
            {[32, 64, 128, 256].map((size) => (
              <View key={size} style={styles.faviconItem}>
                <View style={[styles.faviconContainer, { width: size, height: size }]}>
                  <LinearGradient
                    colors={['#0a0a0f', '#1e293b']}
                    style={[styles.faviconGradient, { width: size, height: size, borderRadius: size * 0.25 }]}
                  >
                    <View style={styles.faviconLogoContainer}>
                      <View style={styles.faviconLogoTopContainer}>
                        <Text style={[styles.faviconLogoTop, { fontSize: size * 0.2 }]}>L</Text>
                        <View style={[styles.faviconFunnyO, { 
                          width: size * 0.25, 
                          height: size * 0.25,
                          borderRadius: size * 0.125,
                          borderWidth: size * 0.02,
                        }]}>
                          <View style={[styles.faviconFunnyOInner, { 
                            width: size * 0.18, 
                            height: size * 0.18 
                          }]}>
                            <View style={[styles.faviconFunnyOLeftEye, { 
                              width: size * 0.025, 
                              height: size * 0.025,
                              borderRadius: size * 0.0125,
                              top: size * 0.04,
                              left: size * 0.04,
                            }]} />
                            <View style={[styles.faviconFunnyORightEye, { 
                              width: size * 0.025, 
                              height: size * 0.025,
                              borderRadius: size * 0.0125,
                              top: size * 0.04,
                              right: size * 0.04,
                            }]} />
                            <View style={[styles.faviconFunnyOMouth, { 
                              width: size * 0.08,
                              height: size * 0.05,
                              borderBottomWidth: size * 0.012,
                              bottom: size * 0.04,
                            }]} />
                          </View>
                        </View>
                        <Text style={[styles.faviconLogoTop, { fontSize: size * 0.2 }]}>L</Text>
                      </View>
                      <Text style={[styles.faviconLogoBottom, { fontSize: size * 0.14 }]}>STONE</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.faviconSizeLabel}>{size}x{size}px</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Color Palette */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Palette</Text>
          <Text style={styles.sectionDescription}>
            Primary brand colors used in the logo and design system.
          </Text>
          
          <View style={styles.colorGrid}>
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: '#00f5d4' }]} />
              <Text style={styles.colorName}>Primary Cyan</Text>
              <Text style={styles.colorCode}>#00f5d4</Text>
            </View>
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.colorName}>Primary Blue</Text>
              <Text style={styles.colorCode}>#3b82f6</Text>
            </View>
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: '#ffffff' }]} />
              <Text style={styles.colorName}>White</Text>
              <Text style={styles.colorCode}>#ffffff</Text>
            </View>
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: '#0a0a0f' }]} />
              <Text style={styles.colorName}>Background</Text>
              <Text style={styles.colorCode}>#0a0a0f</Text>
            </View>
          </View>
        </View>

        {/* Banner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banner</Text>
          <Text style={styles.sectionDescription}>
            1024x1024px square banner for promotional use.
          </Text>
          
          <View style={styles.bannerShowcase}>
            <View style={styles.bannerItem}>
              <View style={styles.bannerContainer}>
                <LinearGradient
                  colors={['#0a0a0f', '#1e293b']}
                  style={styles.bannerGradient}
                >
                  <View style={styles.bannerLogoContainer}>
                    <View style={styles.bannerLogoTopContainer}>
                      <Text style={styles.bannerLogoTop}>L</Text>
                      <View style={styles.bannerFunnyO}>
                        <View style={styles.bannerFunnyOInner}>
                          <View style={styles.bannerFunnyOLeftEye} />
                          <View style={styles.bannerFunnyORightEye} />
                          <View style={styles.bannerFunnyOMouth} />
                        </View>
                      </View>
                      <Text style={styles.bannerLogoTop}>L</Text>
                    </View>
                    <Text style={styles.bannerLogoBottom}>STONE</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.bannerSizeLabel}>1024x1024px</Text>
            </View>
          </View>
        </View>

        {/* Spacing */}
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  topHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
  },
  headerBlur: {
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoButton: {
    paddingVertical: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
  headerLogoContainer: {
    alignItems: 'center',
    gap: 0,
  },
  headerLogoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerLogoTopText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#00f5d4',
    lineHeight: 20,
  },
  headerFunnyOContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    marginHorizontal: 2,
  },
  headerFunnyO: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerFunnyOInner: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerFunnyOLeftEye: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#00f5d4',
  },
  headerFunnyORightEye: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#00f5d4',
  },
  headerFunnyOMouth: {
    position: 'absolute',
    bottom: 3,
    width: 10,
    height: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  headerLogoBottomText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#ffffff',
    lineHeight: 16,
    marginTop: -3,
    transform: [{ rotate: '-5deg' }],
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00f5d4',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    marginTop: 60,
  },
  heroSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  logoShowcase: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
  },
  stackedLogoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  logoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  logoTop: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#00f5d4',
    textShadowColor: 'rgba(0, 245, 212, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    zIndex: 1,
    lineHeight: 80,
  },
  funnyOContainer: {
    width: 80,
    height: 80,
    position: 'relative',
    marginHorizontal: 4,
  },
  funnyO: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'relative',
  },
  funnyOInner: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  funnyOLeftEye: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00f5d4',
  },
  funnyORightEye: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00f5d4',
  },
  funnyOMouth: {
    position: 'absolute',
    bottom: 12,
    width: 30,
    height: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  logoBottom: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    zIndex: 1,
    lineHeight: 50,
    marginTop: -20,
    transform: [{ rotate: '-5deg' }],
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: '110%',
    height: '120%',
    borderRadius: 30,
    backgroundColor: '#00f5d4',
    opacity: 0.15,
    zIndex: 0,
  },
  title: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    zIndex: 1,
    position: 'relative',
  },
  titleGradient: {
    color: '#00f5d4',
    textShadowColor: 'rgba(0, 245, 212, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleSolid: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  variationsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  variationCard: {
    flex: 1,
    minWidth: 200,
    maxWidth: 300,
  },
  variationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  variationPreview: {
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  avatarShowcase: {
    flexDirection: 'row',
    gap: spacing.xl,
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },
  avatarItem: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.sm,
  },
  avatarGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLightBackground: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  avatarLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLogoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  avatarLogoTop: {
    fontWeight: '900',
    letterSpacing: 2,
    color: '#00f5d4',
    lineHeight: 28,
  },
  avatarLogoBottom: {
    fontWeight: '900',
    letterSpacing: 2,
    color: '#ffffff',
    lineHeight: 20,
    marginTop: -6,
    transform: [{ rotate: '-5deg' }],
  },
  avatarFunnyO: {
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 2,
  },
  avatarFunnyOInner: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarFunnyOLeftEye: {
    position: 'absolute',
    backgroundColor: '#00f5d4',
  },
  avatarFunnyORightEye: {
    position: 'absolute',
    backgroundColor: '#00f5d4',
  },
  avatarFunnyOMouth: {
    position: 'absolute',
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  avatarSizeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerExample: {
    marginBottom: spacing.lg,
  },
  headerExampleBar: {
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  headerExampleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerExampleNav: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  headerNavItem: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  faviconShowcase: {
    flexDirection: 'row',
    gap: spacing.xl,
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  faviconItem: {
    alignItems: 'center',
  },
  faviconContainer: {
    marginBottom: spacing.sm,
  },
  faviconGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faviconLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faviconLogoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  faviconLogoTop: {
    fontWeight: '900',
    letterSpacing: 1,
    color: '#00f5d4',
    lineHeight: 20,
  },
  faviconLogoBottom: {
    fontWeight: '900',
    letterSpacing: 1,
    color: '#ffffff',
    lineHeight: 14,
    marginTop: -3,
    transform: [{ rotate: '-5deg' }],
  },
  faviconFunnyO: {
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 1,
  },
  faviconFunnyOInner: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  faviconFunnyOLeftEye: {
    position: 'absolute',
    backgroundColor: '#00f5d4',
  },
  faviconFunnyORightEye: {
    position: 'absolute',
    backgroundColor: '#00f5d4',
  },
  faviconFunnyOMouth: {
    position: 'absolute',
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  faviconSizeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorItem: {
    alignItems: 'center',
    minWidth: 150,
  },
  colorSwatch: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: spacing.xs,
  },
  colorCode: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bannerShowcase: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  bannerItem: {
    alignItems: 'center',
  },
  bannerContainer: {
    marginBottom: spacing.sm,
    width: 1024,
    height: 1024,
    maxWidth: '100%',
    maxHeight: '80vh',
    aspectRatio: 1,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  bannerGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLogoTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  bannerLogoTop: {
    fontSize: 256,
    fontWeight: '900',
    letterSpacing: 32,
    color: '#00f5d4',
    lineHeight: 280,
    textShadowColor: 'rgba(0, 245, 212, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },
  bannerLogoBottom: {
    fontSize: 192,
    fontWeight: '900',
    letterSpacing: 24,
    color: '#ffffff',
    lineHeight: 200,
    marginTop: -40,
    transform: [{ rotate: '-5deg' }],
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  bannerFunnyO: {
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 24,
    borderColor: '#00f5d4',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 16,
  },
  bannerFunnyOInner: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bannerFunnyOLeftEye: {
    position: 'absolute',
    top: 64,
    left: 64,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00f5d4',
  },
  bannerFunnyORightEye: {
    position: 'absolute',
    top: 64,
    right: 64,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00f5d4',
  },
  bannerFunnyOMouth: {
    position: 'absolute',
    bottom: 64,
    width: 128,
    height: 80,
    borderBottomWidth: 24,
    borderBottomColor: '#00f5d4',
    borderBottomLeftRadius: 64,
    borderBottomRightRadius: 64,
  },
  bannerSizeLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  spacer: {
    height: spacing.xxl,
  },
});
