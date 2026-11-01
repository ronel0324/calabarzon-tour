import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
  useWindowDimensions
} from 'react-native';

// Palette: hango sa Taal Lake, sa ginto ng araw sa watawat, at sa kulay ng Pahiyas
const COLORS = {
  taal: '#0E3B43', // malalim na teal ng lawa
  taalSoft: '#1D5963',
  paper: '#F5F6F1',
  white: '#FFFFFF',
  gold: '#D9A441',
  goldDeep: '#A87A1C',
  vermilion: '#B8372F',
  leaf: '#3F7D4E',
  leafSoft: '#E3EEE5',
  ink: '#1D2A2E',
  muted: '#5C6A6D',
  line: '#E1E3DA'
};

// Serif para sa mga pamagat (heritage na dating), system font para sa maliliit na teksto
const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: 'serif'
});

const MENU_ITEMS = [
  {
    key: 'list',
    icon: '📍',
    title: 'Browse Destinations',
    subtitle: 'Tourist spots and cultural sites',
    route: 'DestinationList'
  },
  {
    key: 'add',
    icon: '➕',
    title: 'Add Destination',
    subtitle: 'Contribute a new location',
    route: 'AddDestination'
  },
  {
    key: 'progress',
    icon: '📊',
    title: 'My Progress',
    subtitle: 'Completed tours and quiz scores',
    route: 'Progress'
  }
];

const PROVINCE_HIGHLIGHTS = [
  {
    name: 'Cavite',
    text: 'Aguinaldo Shrine in Kawit, where independence was proclaimed in 1898.'
  },
  {
    name: 'Laguna',
    text: 'Pila, a historic town of preserved ancestral houses around a plaza.'
  },
  {
    name: 'Batangas',
    text: 'Taal Heritage Town and the view of Taal Volcano and its lake.'
  },
  {
    name: 'Rizal',
    text: 'Angono, home of the Petroglyphs and known as the art capital.'
  },
  {
    name: 'Quezon',
    text: 'Lucban and the Pahiyas Festival, when houses are covered in colorful kiping.'
  }
];

// Hinabing banig na border: hilera ng maliliit na diamond, ang tanging palamuti ng screen
const WeaveBand = () => {
  const { width } = useWindowDimensions();
  const cell = 14;
  const count = Math.ceil(width / cell);
  const palette = [COLORS.gold, COLORS.vermilion, COLORS.leaf, COLORS.gold, COLORS.taalSoft];

  return (
    <View style={styles.weaveBand}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.weaveCell}>
          <View
            style={[styles.weaveDiamond, { backgroundColor: palette[i % palette.length] }]}
          />
        </View>
      ))}
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const [aboutExpanded, setAboutExpanded] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/calabarzon.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroTint} />
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>Calabarzon</Text>
            <Text style={styles.heroSubtitle}>
              Five provinces of heritage, history, and landscape
            </Text>
          </View>
        </View>
        <WeaveBand />

        <View style={styles.content}>
          <Text style={styles.intro}>
            Explore the rich cultural heritage and tourist destinations of Region IV-A.
          </Text>

          {/* Featured: Map */}
          <TouchableOpacity
            style={styles.featured}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Map')}
            accessibilityRole="button"
            accessibilityLabel="Open map view"
          >
            <View style={styles.featuredMedallion}>
              <Text style={styles.featuredIcon}>🗺️</Text>
            </View>
            <View style={styles.featuredText}>
              <Text style={styles.featuredTitle}>Map View</Text>
              <Text style={styles.featuredSubtitle}>
                See every destination, filter by province, and get directions
              </Text>
            </View>
          </TouchableOpacity>

          {/* Menu list */}
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.menuList}>
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuRow, index > 0 && styles.menuRowDivider]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={styles.menuMedallion}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Heritage highlights */}
          <Text style={styles.sectionTitle}>Heritage in five provinces</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.provinceRow}
        >
          {PROVINCE_HIGHLIGHTS.map((p) => (
            <View key={p.name} style={styles.provinceCard}>
              <Text style={styles.provinceName}>{p.name}</Text>
              <Text style={styles.provinceText}>{p.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* About */}
          <View style={styles.about}>
            <Text style={styles.aboutTitle}>About CALABARZON</Text>
            <View style={styles.goldRule} />

            <Text
              style={styles.aboutText}
              numberOfLines={aboutExpanded ? undefined : 6}
            >
              Region IV-A (CALABARZON), officially designated as Region IV-A, stands as the most
              populous and economically dynamic administrative region in the Philippines. Situated
              immediately southeast of Metro Manila, this contiguous landmass derives its unique name
              from the acronym of its five constituent provinces: Cavite, Laguna, Batangas, Rizal, and
              Quezon. The region seamlessly bridges the gap between rapid urban modernization and
              preserved natural heritage, hosting massive industrial parks, high-tech manufacturing
              hubs, and vital shipping ports alongside lush agricultural fields and protected mountain
              ranges.
            </Text>

            {aboutExpanded && (
              <Text style={[styles.aboutText, styles.aboutSecondParagraph]}>
                Beyond its massive economic contribution as a manufacturing engine for the country,
                CALABARZON is steeped in profound cultural and historical significance. It is the
                birthplace of national heroes like Jose Rizal and Emilio Aguinaldo, the cradle of early
                Philippine independence, and a sanctuary for traditional arts. Its diverse
                landscape, characterized by calm inland lakes, rugged volcanic ridges like Tagaytay,
                and expansive coastlines, makes it a primary destination for ecotourism and a vital
                gateway to southern Luzon.
              </Text>
            )}

            <TouchableOpacity
              onPress={() => setAboutExpanded((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={aboutExpanded ? 'Show less' : 'Read more'}
            >
              <Text style={styles.readMore}>{aboutExpanded ? 'Show less' : 'Read more'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <WeaveBand />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.taal // tugma sa hero at sa status bar
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.paper
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0
  },

  // Hero
  hero: {
    height: 280,
    backgroundColor: COLORS.taal
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 59, 67, 0.28)'
  },
  heroTextBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: 'rgba(14, 59, 67, 0.82)'
  },
  heroTitle: {
    fontFamily: SERIF,
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.4
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#E8D9AE',
    lineHeight: 20
  },

  // Weave band
  weaveBand: {
    flexDirection: 'row',
    height: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.taal,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gold
  },
  weaveCell: {
    width: 14,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  weaveDiamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }]
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 22
  },
  intro: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 26,
    color: COLORS.ink,
    marginBottom: 22
  },

  // Featured map card
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.taal,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    padding: 18,
    marginBottom: 28
  },
  featuredMedallion: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  featuredIcon: {
    fontSize: 30
  },
  featuredText: {
    flex: 1
  },
  featuredTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4
  },
  featuredSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#CFE0E2'
  },

  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 12
  },

  // Menu list
  menuList: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 30,
    overflow: 'hidden'
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  menuRowDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line
  },
  menuMedallion: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.leafSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  menuIcon: {
    fontSize: 22
  },
  menuText: {
    flex: 1
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2
  },
  menuChevron: {
    fontSize: 26,
    color: COLORS.goldDeep,
    marginLeft: 8
  },

  // Province highlights
  provinceRow: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 12
  },
  provinceCard: {
    width: 210,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  provinceName: {
    fontFamily: SERIF,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.taal,
    marginBottom: 6
  },
  provinceText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted
  },

  // About
  about: {
    marginTop: 18,
    marginBottom: 30
  },
  aboutTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink
  },
  goldRule: {
    width: 48,
    height: 3,
    backgroundColor: COLORS.gold,
    marginTop: 8,
    marginBottom: 14
  },
  aboutText: {
    fontFamily: SERIF,
    fontSize: 15,
    lineHeight: 25,
    color: '#3B484B'
  },
  aboutSecondParagraph: {
    marginTop: 12
  },
  readMore: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.goldDeep
  }
});