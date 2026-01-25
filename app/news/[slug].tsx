import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, Platform, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors, spacing } from '../../src/constants/theme';

interface Article {
  slug: string;
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  content: string[];
  hasTokenomics?: boolean;
  hasGameGuide?: boolean;
}

const articles: Record<string, Article> = {
  'how-the-game-works': {
    slug: 'how-the-game-works',
    title: 'How the Game Works',
    description: 'Learn the core mechanics, strategies, and gameplay of Lolstone. Master the art of meme-based card battles.',
    metaTitle: 'How the Game Works - Lolstone Card Game Guide',
    metaDescription: 'Learn how to play Lolstone, the ultimate meme-based card game. Master deck building, combat mechanics, and strategic gameplay.',
    hasGameGuide: true,
    content: [
      'Lolstone is the ultimate turn-based card game built entirely around internet culture. Think strategic duels like classic card battlers, but instead of wizards and dragons, your deck is packed with memes, viral roasts, trolls, reactions, and chaotic online moments that everyone recognizes.',
      'You and an opponent face off on the board. Each player starts with 30 health. Your goal is simple: reduce your opponent\'s health to zero before they do the same to you. Matches are quick, intense, and full of laugh-out-loud swings.',
    ],
  },
  'lols-token': {
    slug: 'lols-token',
    title: '$LOLS Token',
    description: 'Meet $LOLS - the official meme coin powering the Lolstone ecosystem. Purchase, trade, and use $LOLS to buy booster packs and participate in the game economy.',
    metaTitle: '$LOLS Token - Official Meme Coin of Lolstone',
    metaDescription: 'Discover $LOLS, the official meme coin integrated into Lolstone. Purchase on pump.fun, use it to buy booster packs, and participate in the game economy.',
    hasTokenomics: false,
    content: [
      '$LOLS is the official meme coin of the Lolstone ecosystem, recently launched and fully integrated into our game economy. This isn\'t just another meme coin—it\'s the native currency that powers every transaction within Lolstone.',
      'We\'ve made $LOLS the exclusive payment method for all in-game purchases. You can now only trade and purchase booster packs using $LOLS tokens, creating a seamless connection between the token and the game experience. This integration ensures that every player who wants to expand their collection must engage with the $LOLS ecosystem.',
      'The token is available for purchase on pump.fun, making it easy for players and investors to acquire $LOLS and join the Lolstone community. Whether you\'re buying your first booster pack or building a legendary collection, $LOLS is your gateway to the game.',
      'By requiring $LOLS for all booster pack purchases, we\'ve created a sustainable economic model where token utility drives real demand. As more players join and purchase packs, the demand for $LOLS increases, creating value for holders while ensuring the token remains accessible to new players.',
      'The integration of $LOLS into Lolstone represents a new era of gaming where cryptocurrency and gameplay are truly intertwined. Players aren\'t just buying cards—they\'re participating in a token economy that grows with the game.',
    ],
  },
  'lolstone-token': {
    slug: 'lolstone-token',
    title: '$lolstone Token',
    description: 'Discover the native cryptocurrency powering the Lolstone ecosystem. Learn about tokenomics, rewards, and earning opportunities.',
    metaTitle: '$lolstone Token - Cryptocurrency & Tokenomics Guide',
    metaDescription: 'Learn about $lolstone, the native cryptocurrency of Lolstone. Discover tokenomics, rewards, staking, and how to earn tokens through gameplay.',
    hasTokenomics: true,
    content: [
      '$lolstone is the native cryptocurrency of the Lolstone ecosystem, fueling the game economy where internet memes battle for supremacy. Every holder owns a stake in the game\'s explosive growth, turning laughs into real rewards.',
      'Built on the Solana blockchain, $lolstone represents more than just a digital asset—it\'s the lifeblood of a community-driven gaming revolution. The token seamlessly integrates into every aspect of the Lolstone experience, from match rewards to governance decisions.',
      'The token serves multiple critical purposes within the game. Players earn $lolstone by winning matches, completing daily quests, participating in tournaments, and achieving milestones. These tokens can then be used to purchase card packs, unlock premium features, trade with other players, and access exclusive content.',
      'What sets $lolstone apart is its deflationary mechanism combined with utility-driven demand. Every transaction includes a 1% tax that funds token burns and liquidity pools, creating a sustainable economic model that benefits long-term holders while rewarding active players.',
      'Tokenomics are meticulously designed to reward active players and long-term holders alike. A significant portion of all in-game transactions flows back to the community through rewards, staking mechanisms, and governance participation. The more you play, the more you earn—creating a virtuous cycle of engagement and value creation.',
      'Staking $lolstone tokens unlocks a world of additional benefits. Stakers receive exclusive card access, priority tournament entry, enhanced ducat earning rates, and governance voting rights. Holders can vote on game updates, new card releases, balance changes, and community initiatives, ensuring the game evolves with its player base.',
      'The token economy creates a sustainable ecosystem where players are incentivized to participate, compete, and contribute to the community. As the game grows and attracts more players, the demand for $lolstone increases, creating natural price appreciation while maintaining accessibility for new players.',
      'Beyond gaming, $lolstone holders benefit from passive income opportunities. Marketplace transaction fees are distributed to stakers, meaning as the player base grows and trading volume increases, token holders earn more. This creates alignment between token value and game success.',
      'Security and trust are paramount. The token features a fair launch with no presale, authority revocation for true decentralization, comprehensive smart contract audits, and automatic burn mechanisms. The liquidity pool is locked forever on Raydium, ensuring price stability and preventing rug pulls.',
      'Join the revolution where gaming meets cryptocurrency. Start earning $lolstone today by playing matches, building your collection, and becoming part of the Lolstone community. Whether you\'re a competitive player, collector, or long-term investor, $lolstone offers multiple pathways to value creation.',
    ],
  },
};

export default function ArticlePage() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const article = articles[slug || ''];

  if (!article) {
    return (
      <View style={styles.container}>
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
        </View>
      </View>
    );
  }

  // Update document title and meta tags
  useEffect(() => {
    if (typeof document !== 'undefined' && article) {
      document.title = article.metaTitle;
      
      // Update or create meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', article.metaDescription);

      // Update or create Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', article.metaTitle);

      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', article.metaDescription);

      // Twitter Card tags
      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', article.metaTitle);

      let twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', article.metaDescription);
    }
  }, [article]);

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
        {/* Article Content */}
        <View style={styles.articleContainer}>
          <Animated.View entering={FadeIn.duration(400)}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleDescription}>{article.description}</Text>
            
            <View style={styles.articleContent}>
              {article.content.map((paragraph, index) => (
                <Text key={index} style={styles.articleParagraph}>
                  {paragraph}
                </Text>
              ))}
            </View>

            {/* Game Guide Section for how-the-game-works */}
            {article.hasGameGuide && slug === 'how-the-game-works' && (
              <View style={styles.gameGuideWrapper}>
                {/* Core Mechanics Section */}
                <View style={styles.gameGuideSection}>
                  <Text style={styles.gameGuideSectionTitle}>Core Mechanics</Text>
                  <View style={styles.mechanicsGrid}>
                    <View style={styles.mechanicCard}>
                      <Text style={styles.mechanicNumber}>01</Text>
                      <Text style={styles.mechanicTitle}>Build Your Deck</Text>
                      <Text style={styles.mechanicDesc}>Create a deck of exactly 30 cards from your collection. Each card has a mana cost, attack, health, and unique abilities.</Text>
                    </View>
                    <View style={styles.mechanicCard}>
                      <Text style={styles.mechanicNumber}>02</Text>
                      <Text style={styles.mechanicTitle}>Play Units</Text>
                      <Text style={styles.mechanicDesc}>Take turns playing units onto the board (up to 7 per side). Strategy comes from combining cards that work well together.</Text>
                    </View>
                    <View style={styles.mechanicCard}>
                      <Text style={styles.mechanicNumber}>03</Text>
                      <Text style={styles.mechanicTitle}>Manage Mana</Text>
                      <Text style={styles.mechanicDesc}>Bandwidth crystals (your mana) refill each turn, ramping from 1 to 10. Plan your plays carefully as mana is limited early.</Text>
                    </View>
                    <View style={styles.mechanicCard}>
                      <Text style={styles.mechanicNumber}>04</Text>
                      <Text style={styles.mechanicTitle}>Attack & Trade</Text>
                      <Text style={styles.mechanicDesc}>Attack with ready units—damage is simultaneous, so trades feel fair and brutal. Units can attack enemies or the opponent directly.</Text>
                    </View>
                    <View style={styles.mechanicCard}>
                      <Text style={styles.mechanicNumber}>05</Text>
                      <Text style={styles.mechanicTitle}>Win Conditions</Text>
                      <Text style={styles.mechanicDesc}>Win by outplaying your opponent with clever combos, timely roasts, and meme timing. Every match is different and exciting.</Text>
                    </View>
                  </View>
                </View>

                {/* Board Layout Section */}
                <View style={styles.gameGuideSection}>
                  <Text style={styles.gameGuideSectionTitle}>Board Layout</Text>
                  <View style={styles.boardLayoutCard}>
                    <View style={styles.boardItem}>
                      <View style={styles.boardIcon} />
                      <View style={styles.boardTextContainer}>
                        <Text style={styles.boardItemTitle}>Your Profile</Text>
                        <Text style={styles.boardItemDesc}>Avatar and health bar positioned on the bottom left</Text>
                      </View>
                    </View>
                    <View style={styles.boardItem}>
                      <View style={styles.boardIcon} />
                      <View style={styles.boardTextContainer}>
                        <Text style={styles.boardItemTitle}>Your Units</Text>
                        <Text style={styles.boardItemDesc}>Up to 7 units positioned across the centre bottom</Text>
                      </View>
                    </View>
                    <View style={styles.boardItem}>
                      <View style={styles.boardIcon} />
                      <View style={styles.boardTextContainer}>
                        <Text style={styles.boardItemTitle}>Hand & Resources</Text>
                        <Text style={styles.boardItemDesc}>Hand at the bottom, deck bottom-left, bandwidth top-right</Text>
                      </View>
                    </View>
                    <View style={styles.boardItem}>
                      <View style={styles.boardIcon} />
                      <View style={styles.boardTextContainer}>
                        <Text style={styles.boardItemTitle}>Opponent</Text>
                        <Text style={styles.boardItemDesc}>Mirrored layout at the top of the board</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Cards & Collecting Section */}
                <View style={styles.gameGuideSection}>
                  <Text style={styles.gameGuideSectionTitle}>Cards & Collecting</Text>
                  <Text style={styles.gameGuideParagraph}>
                    Every card is a unique digital collectible based on real internet memes. Each instance you own has its own serial number and edition (e.g., #42 of First Edition). Cards come in four rarities: common, rare, epic, and legendary.
                  </Text>
                  <Text style={styles.gameGuideParagraph}>
                    Only we, the game masters, can create and mint new card designs and batches. This keeps the ecosystem controlled, balanced, and special—no flood of junk cards. When we mint a batch, those copies become permanent and enter the game forever. Some go into reward pools, some are sold, some are airdropped to active players.
                  </Text>
                  
                  <View style={styles.collectionMethods}>
                    <Text style={styles.collectionMethodsTitle}>How to Get Cards</Text>
                    <View style={styles.collectionMethodCard}>
                      <Text style={styles.collectionMethodIcon}>🎁</Text>
                      <Text style={styles.collectionMethodTitle}>Earn Through Play</Text>
                      <Text style={styles.collectionMethodDesc}>Earn cards through play rewards and events</Text>
                    </View>
                    <View style={styles.collectionMethodCard}>
                      <Text style={styles.collectionMethodIcon}>💎</Text>
                      <Text style={styles.collectionMethodTitle}>Buy Packs</Text>
                      <Text style={styles.collectionMethodDesc}>Buy packs with ducats (in-game currency)</Text>
                    </View>
                    <View style={styles.collectionMethodCard}>
                      <Text style={styles.collectionMethodIcon}>💰</Text>
                      <Text style={styles.collectionMethodTitle}>Trade & Sell</Text>
                      <Text style={styles.collectionMethodDesc}>Trade cards on the marketplace to earn real money</Text>
                    </View>
                  </View>
                </View>

                {/* Getting Started Section */}
                <View style={styles.gameGuideSection}>
                  <Text style={styles.gameGuideSectionTitle}>How It Works</Text>
                  <Text style={styles.gameGuideParagraph}>
                    Getting started with Lolstone is simple. Follow these three easy steps to begin your journey into meme-based card battles.
                  </Text>
                  
                  <View style={styles.stepsContainer}>
                    <View style={styles.stepCard}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>1</Text>
                      </View>
                      <Text style={styles.stepTitle}>Create Account</Text>
                      <Text style={styles.stepDesc}>Sign up and get 100 free ducats to start building your collection</Text>
                    </View>

                    <View style={styles.stepCard}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>2</Text>
                      </View>
                      <Text style={styles.stepTitle}>Build Your Deck</Text>
                      <Text style={styles.stepDesc}>Collect cards and craft strategies that match your playstyle</Text>
                    </View>

                    <View style={styles.stepCard}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>3</Text>
                      </View>
                      <Text style={styles.stepTitle}>Battle & Win</Text>
                      <Text style={styles.stepDesc}>Compete in matches, climb rankings, and earn rewards</Text>
                    </View>
                  </View>
                </View>

                {/* Why Play Section */}
                <View style={styles.gameGuideSection}>
                  <Text style={styles.gameGuideSectionTitle}>Why Play Lolstone</Text>
                  <Text style={styles.gameGuideParagraph}>
                    Lolstone offers a unique blend of strategic gameplay, collectible cards, and internet culture. Here's what makes it special:
                  </Text>
                  
                  <View style={styles.featuresGrid}>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>🃏</Text>
                      <Text style={styles.featureTitle}>Collect Cards</Text>
                      <Text style={styles.featureDesc}>Build your collection with unique, meme-inspired cards</Text>
                    </View>

                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>⚔️</Text>
                      <Text style={styles.featureTitle}>Battle Players</Text>
                      <Text style={styles.featureDesc}>Test your strategy against players worldwide</Text>
                    </View>

                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>💰</Text>
                      <Text style={styles.featureTitle}>Earn Rewards</Text>
                      <Text style={styles.featureDesc}>Win matches and complete quests for ducats</Text>
                    </View>

                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>🎲</Text>
                      <Text style={styles.featureTitle}>Pure Chaos</Text>
                      <Text style={styles.featureDesc}>Unpredictable effects and hilarious moments</Text>
                    </View>
                  </View>

                  <View style={styles.benefitsGrid}>
                    <View style={styles.benefitCard}>
                      <Text style={styles.benefitIcon}>🆓</Text>
                      <Text style={styles.benefitTitle}>Free to Start</Text>
                      <Text style={styles.benefitDesc}>Create an account, claim starter packs, and jump into matches</Text>
                    </View>
                    <View style={styles.benefitCard}>
                      <Text style={styles.benefitIcon}>💎</Text>
                      <Text style={styles.benefitTitle}>Own What You Earn</Text>
                      <Text style={styles.benefitDesc}>Every card you acquire is truly yours—trade, sell, or hold</Text>
                    </View>
                    <View style={styles.benefitCard}>
                      <Text style={styles.benefitIcon}>🔄</Text>
                      <Text style={styles.benefitTitle}>Fresh Content</Text>
                      <Text style={styles.benefitDesc}>We regularly mint new meme-inspired cards and expansions</Text>
                    </View>
                    <View style={styles.benefitCard}>
                      <Text style={styles.benefitIcon}>👥</Text>
                      <Text style={styles.benefitTitle}>Community-Driven</Text>
                      <Text style={styles.benefitDesc}>Join duels, climb ranks, and chat with fellow players</Text>
                    </View>
                  </View>
                  
                  <View style={styles.ctaCard}>
                    <Text style={styles.ctaTitle}>Ready to battle with the internet's greatest hits?</Text>
                    <Text style={styles.ctaSubtext}>Sign up now, grab your starter deck, and start roasting opponents today.</Text>
                    <Pressable style={styles.ctaButton} onPress={() => router.push('/auth/player')}>
                      <Text style={styles.ctaButtonText}>Start Playing Now</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* LOLS Token Section */}
            {slug === 'lols-token' && (
              <View style={styles.lolsTokenWrapper}>
                <LinearGradient
                  colors={[colors.primary + '10', colors.secondary + '05', colors.primary + '10']}
                  style={styles.tokenGradient}
                >
                  <View style={styles.tokenContent}>
                    <View style={styles.tokenHeader}>
                      <Text style={styles.tokenMainTitle}>Get $LOLS</Text>
                      <Text style={styles.tokenSubtitle}>Purchase on Pump.fun</Text>
                    </View>

                    <Pressable
                      style={styles.purchaseButton}
                      onPress={() => {
                        if (typeof window !== 'undefined') {
                          window.open('https://pump.fun/coin/BDD5XKXLSC6fSAFmTVpVWFTdfSSG7a2LTYxBXt6rpump', '_blank');
                        }
                      }}
                    >
                      <LinearGradient
                        colors={['#8b5cf6', '#a855f7']}
                        style={styles.purchaseButtonGradient}
                      >
                        <Text style={styles.purchaseButtonText}>🪙 Buy $LOLS on Pump.fun</Text>
                      </LinearGradient>
                    </Pressable>

                    {/* Price Chart */}
                    <View style={styles.chartContainer}>
                      <Text style={styles.chartTitle}>Live Price Chart</Text>
                      {Platform.OS === 'web' ? (
                        <View style={styles.chartWrapper}>
                          <iframe
                            src="https://www.geckoterminal.com/solana/pools/3Hr5WfBvUYZToU974XrX5pGKb6H4siBvZFeYSiyeYUFk?embed=1&info=0&swaps=0"
                            style={{
                              width: '100%',
                              height: '400px',
                              border: 'none',
                              borderRadius: '12px',
                            }}
                            title="$LOLS Price Chart"
                          />
                        </View>
                      ) : (
                        <Pressable
                          style={styles.chartLinkButton}
                          onPress={() => Linking.openURL('https://www.geckoterminal.com/solana/pools/3Hr5WfBvUYZToU974XrX5pGKb6H4siBvZFeYSiyeYUFk')}
                        >
                          <Text style={styles.chartLinkText}>View Price Chart on GeckoTerminal →</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Usage Section */}
                    <View style={styles.usageSection}>
                      <Text style={styles.usageTitle}>How to Use $LOLS</Text>
                      <View style={styles.usageGrid}>
                        <View style={styles.usageCard}>
                          <Text style={styles.usageIcon}>💎</Text>
                          <Text style={styles.usageCardTitle}>Buy Booster Packs</Text>
                          <Text style={styles.usageCardDesc}>
                            $LOLS is the exclusive payment method for all booster pack purchases in Lolstone
                          </Text>
                        </View>
                        <View style={styles.usageCard}>
                          <Text style={styles.usageIcon}>🔄</Text>
                          <Text style={styles.usageCardTitle}>Trade Cards</Text>
                          <Text style={styles.usageCardDesc}>
                            Use $LOLS to trade cards with other players on the marketplace
                          </Text>
                        </View>
                        <View style={styles.usageCard}>
                          <Text style={styles.usageIcon}>📈</Text>
                          <Text style={styles.usageCardTitle}>Hold & Earn</Text>
                          <Text style={styles.usageCardDesc}>
                            As the game grows, $LOLS value increases with player demand
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Integration Info */}
                    <View style={styles.integrationCard}>
                      <Text style={styles.integrationTitle}>Fully Integrated</Text>
                      <Text style={styles.integrationText}>
                        $LOLS is now the only accepted payment method for purchasing booster packs in Lolstone. 
                        This creates direct utility and demand for the token, ensuring its value is tied to 
                        the success and growth of the game.
                      </Text>
                      <Text style={styles.integrationText}>
                        Connect your Phantom wallet in the shop to purchase ducats with $LOLS, then use those 
                        ducats to buy booster packs and expand your collection.
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Tokenomics Section for lolstone-token */}
            {article.hasTokenomics && slug === 'lolstone-token' && (
              <View style={styles.tokenomicsWrapper}>
                <LinearGradient
                  colors={[colors.primary + '10', colors.secondary + '05', colors.primary + '10']}
                  style={styles.tokenGradient}
                >
                  <View style={styles.tokenContent}>
                    <View style={styles.tokenHeader}>
                      <Text style={styles.tokenMainTitle}>Token Features</Text>
                      <Text style={styles.tokenSubtitle}>Six Core Utilities Powering the Ecosystem</Text>
                    </View>

                    {/* Token Features Grid */}
                    <View style={styles.tokenFeaturesGrid}>
                      <View style={styles.tokenFeature}>
                        <Text style={styles.featureTitle}>Buy Ducats</Text>
                        <Text style={styles.featureDesc}>Purchase ducats at favorable rates for in-game spending</Text>
                      </View>

                      <View style={styles.tokenFeature}>
                        <Text style={styles.featureTitle}>Staking Rewards</Text>
                        <Text style={styles.featureDesc}>Earn free packs, exclusive memes, and boosted ducats</Text>
                      </View>

                      <View style={styles.tokenFeature}>
                        <Text style={styles.featureTitle}>Governance</Text>
                        <Text style={styles.featureDesc}>Vote on new card sets, expansions, and community events</Text>
                      </View>

                      <View style={styles.tokenFeature}>
                        <Text style={styles.featureTitle}>Passive Income</Text>
                        <Text style={styles.featureDesc}>Earn from marketplace fees as player base grows</Text>
                      </View>

                      <View style={styles.tokenFeature}>
                        <Text style={styles.featureTitle}>Deflationary</Text>
                        <Text style={styles.featureDesc}>Transaction taxes fund burns and liquidity</Text>
                      </View>

                      <View style={styles.tokenFeature}>
                        <Text style={styles.featureTitle}>Organic Growth</Text>
                        <Text style={styles.featureDesc}>More players = more duels, trades, and token demand</Text>
                      </View>
                    </View>

                    {/* Tokenomics Section */}
                    <View style={styles.tokenomicsContainer}>
                      <Text style={styles.tokenomicsTitle}>Tokenomics</Text>
                      <Text style={styles.tokenomicsSubtitle}>Transparent, Community-First Distribution</Text>

                      <View style={styles.tokenStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>1B</Text>
                          <Text style={styles.statLabel}>Total Supply</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>SOL</Text>
                          <Text style={styles.statLabel}>Blockchain</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>1%</Text>
                          <Text style={styles.statLabel}>Tax Rate</Text>
                        </View>
                      </View>

                      {/* Allocation Table */}
                      <View style={styles.allocationTable}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Category</Text>
                          <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Allocation</Text>
                          <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Percentage</Text>
                          <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 3 }]}>Details</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>Liquidity Pool</Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>500M</Text>
                          <Text style={[styles.tableCell, { flex: 1, color: colors.primary }]}>50%</Text>
                          <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>Locked forever on Raydium</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>Ecosystem Rewards</Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>200M</Text>
                          <Text style={[styles.tableCell, { flex: 1, color: colors.secondary }]}>20%</Text>
                          <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>12-month linear unlock</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>Team</Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>100M</Text>
                          <Text style={[styles.tableCell, { flex: 1, color: colors.secondary }]}>10%</Text>
                          <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>24-month vest, 6-month cliff</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>Marketing</Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>100M</Text>
                          <Text style={[styles.tableCell, { flex: 1, color: colors.primary }]}>10%</Text>
                          <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>6-month unlock</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>Community Burn</Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>100M</Text>
                          <Text style={[styles.tableCell, { flex: 1, color: colors.secondary }]}>10%</Text>
                          <Text style={[styles.tableCell, { flex: 3, fontSize: 12 }]}>Immediate burn</Text>
                        </View>
                      </View>

                      {/* Security Features */}
                      <View style={styles.securityFeatures}>
                        <Text style={styles.securityTitle}>Security & Trust</Text>

                        <View style={styles.securityGrid}>
                          <View style={styles.securityItem}>
                            <Text style={styles.securityText}>Fair Launch</Text>
                          </View>
                          <View style={styles.securityItem}>
                            <Text style={styles.securityText}>Authority Revoked</Text>
                          </View>
                          <View style={styles.securityItem}>
                            <Text style={styles.securityText}>Full Audit</Text>
                          </View>
                          <View style={styles.securityItem}>
                            <Text style={styles.securityText}>No Rugs</Text>
                          </View>
                          <View style={styles.securityItem}>
                            <Text style={styles.securityText}>Auto Burn</Text>
                          </View>
                          <View style={styles.securityItem}>
                            <Text style={styles.securityText}>LP Locked</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            <Pressable style={styles.backToNewsButton} onPress={() => router.push('/')}>
              <Text style={styles.backToNewsButtonText}>← Back to Home</Text>
            </Pressable>
          </Animated.View>
        </View>
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
    marginTop: -6,
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
  articleContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  articleTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: spacing.md,
    letterSpacing: -1,
  },
  articleDescription: {
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: spacing.xl * 2,
    lineHeight: 30,
    fontWeight: '300',
  },
  articleContent: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  articleParagraph: {
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 28,
    fontWeight: '400',
  },
  backToNewsButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  backToNewsButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  // Tokenomics Styles
  tokenomicsWrapper: {
    marginVertical: spacing.xl * 2,
  },
  tokenGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tokenContent: {
    padding: spacing.xl * 2,
  },
  tokenHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tokenMainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  tokenSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tokenFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl * 2,
  },
  tokenFeature: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    flex: 1,
    minWidth: 200,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tokenomicsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenomicsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tokenomicsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  tokenStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  allocationTable: {
    marginBottom: spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  tableCell: {
    fontSize: 14,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
  },
  tableHeaderText: {
    fontWeight: '700',
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  securityFeatures: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  securityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  securityItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  securityText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Game Guide Styles
  gameGuideWrapper: {
    marginVertical: spacing.xl * 2,
  },
  gameGuideSection: {
    marginBottom: spacing.xl * 2,
  },
  gameGuideSectionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xl,
    letterSpacing: -0.5,
  },
  gameGuideParagraph: {
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: spacing.lg,
    fontWeight: '400',
  },
  mechanicsGrid: {
    gap: spacing.lg,
  },
  mechanicCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  mechanicNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },
  mechanicTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  mechanicDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  boardLayoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boardItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  boardIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: spacing.md,
  },
  boardTextContainer: {
    flex: 1,
  },
  boardItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  boardItemDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  collectionMethods: {
    marginTop: spacing.lg,
  },
  collectionMethodsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  collectionMethodCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  collectionMethodIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  collectionMethodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  collectionMethodDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  benefitsGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  benefitCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  benefitTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  benefitDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  ctaCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: spacing.xl * 2,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  ctaSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  // Steps/How It Works Styles
  stepsContainer: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  stepNumberCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumberText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  // Features Grid Styles
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: 200,
    maxWidth: 300,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // LOLS Token Styles
  lolsTokenWrapper: {
    marginVertical: spacing.xl * 2,
  },
  purchaseButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  purchaseButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  chartContainer: {
    marginBottom: spacing.xl,
  },
  chartTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  chartWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 400,
  },
  chartLinkButton: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    alignItems: 'center',
  },
  chartLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  usageSection: {
    marginBottom: spacing.xl,
  },
  usageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  usageCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: 200,
    maxWidth: 300,
    alignItems: 'center',
  },
  usageIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  usageCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  usageCardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  integrationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xl,
  },
  integrationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  integrationText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
});
