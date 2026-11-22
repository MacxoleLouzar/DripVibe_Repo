import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Image, Linking, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/client';
import { COLORS } from '../theme';

export default function ImageSearchScreen() {
  const [imageUri, setImageUri] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Camera access is required');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSearch = async () => {
    if (!imageUri && !query.trim()) {
      Alert.alert('Required', 'Upload an image or enter a description');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (imageUri) fd.append('image', { uri: imageUri, type: 'image/jpeg', name: 'search.jpg' });
      if (query) fd.append('query', query);
      const { data } = await api.post('/image-search', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(data.results);
    } catch {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.subtitle}>Upload or capture a clothing photo to find it in stores</Text>

      <View style={styles.uploadArea}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <TouchableOpacity style={styles.clearBtn} onPress={() => setImageUri('')}>
              <Text style={styles.clearBtnText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadText}>No image selected</Text>
          </View>
        )}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadBtnText}>📁 Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
          <Text style={styles.uploadBtnText}>📷 Camera</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or describe it</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="e.g. white oversized hoodie, floral summer dress..."
        placeholderTextColor={COLORS.muted}
        value={query}
        onChangeText={setQuery}
        multiline
      />

      <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.searchBtnText}>🔍 Find in Stores</Text>
        )}
      </TouchableOpacity>

      {results.length > 0 && (
        <>
          <Text style={styles.resultsTitle}>Found in {results.length} stores</Text>
          {results.map((item, i) => (
            <TouchableOpacity key={i} style={styles.resultCard} onPress={() => Linking.openURL(item.link)}>
              <Image source={{ uri: item.image }} style={styles.resultImg} />
              <View style={styles.resultInfo}>
                <Text style={styles.resultStore}>{item.store}</Text>
                <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.resultPrice}>{item.price}</Text>
                {item.rating && (
                  <Text style={styles.resultRating}>
                    ⭐ {item.rating} ({Number(item.reviews).toLocaleString()} reviews)
                  </Text>
                )}
                {item.storeReview && (
                  <Text style={styles.storeSummary} numberOfLines={2}>
                    "{item.storeReview.summary}"
                  </Text>
                )}
                <Text style={styles.viewLink}>View in Store →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  subtitle: { fontSize: 13, color: COLORS.muted, marginBottom: 16, lineHeight: 18 },
  uploadArea: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', marginBottom: 12, overflow: 'hidden', minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  uploadPlaceholder: { alignItems: 'center', padding: 40 },
  uploadIcon: { fontSize: 48, marginBottom: 8 },
  uploadText: { fontSize: 14, color: COLORS.muted },
  previewContainer: { width: '100%', position: 'relative' },
  preview: { width: '100%', height: 260, resizeMode: 'cover' },
  clearBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  uploadBtn: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, alignItems: 'center' },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.muted },
  input: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, color: COLORS.text, fontSize: 14, marginBottom: 12, minHeight: 60, textAlignVertical: 'top' },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 24 },
  searchBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  resultsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  resultCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: 'hidden' },
  resultImg: { width: 110, height: 140 },
  resultInfo: { flex: 1, padding: 12 },
  resultStore: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  resultTitle: { fontSize: 13, fontWeight: '500', color: COLORS.text, marginBottom: 6, lineHeight: 18 },
  resultPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  resultRating: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  storeSummary: { fontSize: 11, color: COLORS.muted, fontStyle: 'italic', marginBottom: 6, lineHeight: 16 },
  viewLink: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
