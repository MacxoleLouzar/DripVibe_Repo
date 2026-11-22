import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Image, Alert, ActivityIndicator,
} from 'react-native';
import api from '../api/client';
import { COLORS } from '../theme';

const OCCASIONS = ['casual', 'formal', 'sport', 'party', 'work'];

export default function OutfitScreen() {
  const [tab, setTab] = useState('suggest');
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [event, setEvent] = useState('casual');
  const [suggested, setSuggested] = useState([]);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchSaved(); }, []);

  const fetchWeather = async () => {
    if (!city) return;
    try {
      const { data } = await api.get(`/weather?city=${city}`);
      setWeather(data);
    } catch {
      Alert.alert('Error', 'Could not fetch weather');
    }
  };

  const fetchSaved = async () => {
    try {
      const { data } = await api.get('/outfit');
      setSavedOutfits(data);
    } catch {}
  };

  const suggestOutfit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/outfit/suggest', { weather, event });
      setSuggested(data.outfit);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to suggest outfit');
    } finally {
      setLoading(false);
    }
  };

  const saveOutfit = async () => {
    if (!suggested.length) return;
    try {
      await api.post('/outfit/save', { items: suggested.map(i => i._id), occasion: event, weather: weather?.description, event });
      Alert.alert('Saved!', 'Outfit saved to your collection');
      fetchSaved();
    } catch {
      Alert.alert('Error', 'Failed to save');
    }
  };

  const toggleFav = async (id) => {
    try {
      const { data } = await api.patch(`/outfit/${id}/favorite`);
      setSavedOutfits(savedOutfits.map(o => o._id === id ? data : o));
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'suggest' && styles.tabActive]} onPress={() => setTab('suggest')}>
          <Text style={[styles.tabText, tab === 'suggest' && styles.tabTextActive]}>Suggest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'saved' && styles.tabActive]} onPress={() => setTab('saved')}>
          <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>Saved ({savedOutfits.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tab === 'suggest' && (
          <>
            <View style={styles.card}>
              <View style={styles.weatherRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="City for weather..."
                  placeholderTextColor={COLORS.muted}
                  value={city}
                  onChangeText={setCity}
                />
                <TouchableOpacity style={styles.weatherBtn} onPress={fetchWeather}>
                  <Text style={styles.weatherBtnText}>🌤</Text>
                </TouchableOpacity>
              </View>
              {weather && (
                <View style={styles.weatherBadge}>
                  <Text style={styles.weatherText}>{weather.city}: {Math.round(weather.temp)}°C, {weather.description} {weather.icon}</Text>
                </View>
              )}
              <Text style={styles.label}>Occasion</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {OCCASIONS.map(o => (
                  <TouchableOpacity key={o} style={[styles.chip, event === o && styles.chipActive]} onPress={() => setEvent(o)}>
                    <Text style={[styles.chipText, event === o && styles.chipTextActive]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.suggestBtn} onPress={suggestOutfit} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.suggestBtnText}>✨ Generate Outfit</Text>}
              </TouchableOpacity>
            </View>

            {suggested.length > 0 && (
              <View style={styles.card}>
                <View style={styles.suggestedHeader}>
                  <Text style={styles.sectionTitle}>Today's Look</Text>
                  <TouchableOpacity style={styles.saveBtn} onPress={saveOutfit}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {suggested.map(item => (
                    <View key={item._id} style={styles.outfitItem}>
                      {item.imageUrl ? (
                        <Image source={{ uri: `http://localhost:5000${item.imageUrl}` }} style={styles.outfitImg} />
                      ) : (
                        <View style={[styles.outfitImg, styles.noImg]}>
                          <Text style={styles.noImgText}>{item.category[0].toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.outfitItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.outfitItemCat}>{item.category}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {tab === 'saved' && (
          savedOutfits.length === 0 ? (
            <Text style={styles.empty}>No saved outfits yet</Text>
          ) : (
            savedOutfits.map(outfit => (
              <View key={outfit._id} style={styles.card}>
                <View style={styles.savedHeader}>
                  <View>
                    <Text style={styles.outfitName}>{outfit.name}</Text>
                    <Text style={styles.outfitMeta}>{outfit.occasion} · {outfit.weather}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFav(outfit._id)}>
                    <Text style={{ fontSize: 20 }}>{outfit.isFavorite ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {outfit.items?.map(item => (
                    <View key={item._id} style={styles.savedThumb}>
                      {item.imageUrl ? (
                        <Image source={{ uri: `http://localhost:5000${item.imageUrl}` }} style={styles.thumbImg} />
                      ) : (
                        <View style={[styles.thumbImg, styles.noImg]}>
                          <Text style={{ color: COLORS.border, fontSize: 16 }}>{item.category?.[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.thumbName} numberOfLines={1}>{item.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, padding: 8, gap: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
  tabTextActive: { color: '#000' },
  card: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  weatherRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14 },
  weatherBtn: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, justifyContent: 'center' },
  weatherBtnText: { fontSize: 20 },
  weatherBadge: { backgroundColor: COLORS.card2, borderRadius: 8, padding: 10, marginBottom: 12 },
  weatherText: { fontSize: 13, color: COLORS.muted },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: 'rgba(200,169,110,0.15)', borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: COLORS.muted, textTransform: 'capitalize' },
  chipTextActive: { color: COLORS.primary },
  suggestBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  suggestBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  suggestedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  outfitItem: { width: 110, alignItems: 'center' },
  outfitImg: { width: 110, height: 140, borderRadius: 10, marginBottom: 6 },
  noImg: { backgroundColor: COLORS.card2, justifyContent: 'center', alignItems: 'center' },
  noImgText: { fontSize: 32, fontWeight: '700', color: COLORS.border },
  outfitItemName: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  outfitItemCat: { fontSize: 10, color: COLORS.muted, textTransform: 'capitalize' },
  savedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  outfitName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  outfitMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2, textTransform: 'capitalize' },
  savedThumb: { alignItems: 'center', width: 60 },
  thumbImg: { width: 60, height: 75, borderRadius: 8, marginBottom: 4 },
  thumbName: { fontSize: 10, color: COLORS.muted, textAlign: 'center' },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 60, fontSize: 14 },
});
