import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Image, Linking, ActivityIndicator, Alert,
} from 'react-native';
import api from '../api/client';
import { COLORS } from '../theme';

export default function ShopScreen() {
  const [tab, setTab] = useState('gaps');
  const [gaps, setGaps] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => { fetchGaps(); }, []);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/shop/suggestions');
      setGaps(data.gaps);
      setSuggestions(data.suggestions);
    } catch {
      Alert.alert('Error', 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const { data } = await api.get(`/shop/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
      setTab('search');
    } catch {
      Alert.alert('Error', 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const StoreCard = ({ item }) => (
    <TouchableOpacity style={styles.storeCard} onPress={() => Linking.openURL(item.link)}>
      <Image source={{ uri: item.image }} style={styles.storeImg} />
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.store}</Text>
        <Text style={styles.storeTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.storePrice}>{item.price}</Text>
        {item.rating && (
          <Text style={styles.storeRating}>⭐ {item.rating} ({item.reviews?.toLocaleString()})</Text>
        )}
        <Text style={styles.shopLink}>Shop Now →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Search clothing items..."
          placeholderTextColor={COLORS.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searchLoading}>
          {searchLoading ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.searchBtnText}>🔍</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'gaps' && styles.tabActive]} onPress={() => setTab('gaps')}>
          <Text style={[styles.tabText, tab === 'gaps' && styles.tabTextActive]}>
            Wardrobe Gaps {gaps.length > 0 && `(${gaps.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'search' && styles.tabActive]} onPress={() => setTab('search')}>
          <Text style={[styles.tabText, tab === 'search' && styles.tabTextActive]}>Search Results</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {tab === 'gaps' && (
            gaps.length === 0 ? (
              <Text style={styles.empty}>🎉 Your wardrobe looks complete!</Text>
            ) : (
              suggestions.map((s, i) => (
                <View key={i} style={{ marginBottom: 24 }}>
                  <View style={styles.gapHeader}>
                    <Text style={styles.gapTitle}>{s.category}</Text>
                    <Text style={styles.gapReason}>{s.reason}</Text>
                  </View>
                  {s.stores?.map((store, j) => <StoreCard key={j} item={store} />)}
                </View>
              ))
            )
          )}
          {tab === 'search' && (
            searchResults.length === 0 ? (
              <Text style={styles.empty}>Search for items above</Text>
            ) : (
              searchResults.map((item, i) => <StoreCard key={i} item={item} />)
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  input: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14 },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, justifyContent: 'center', alignItems: 'center', width: 48 },
  searchBtnText: { fontSize: 18 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.muted },
  tabTextActive: { color: '#000' },
  gapHeader: { marginBottom: 12 },
  gapTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, textTransform: 'capitalize' },
  gapReason: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  storeCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: 'hidden' },
  storeImg: { width: 100, height: 120 },
  storeInfo: { flex: 1, padding: 12 },
  storeName: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  storeTitle: { fontSize: 13, fontWeight: '500', color: COLORS.text, marginBottom: 6, lineHeight: 18 },
  storePrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  storeRating: { fontSize: 12, color: COLORS.muted, marginBottom: 6 },
  shopLink: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 60, fontSize: 14 },
});
