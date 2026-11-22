import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Alert, Modal, TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/client';
import { COLORS } from '../theme';

const CATEGORIES = ['tops', 'bottoms', 'shoes', 'accessories', 'outerwear', 'dresses'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const OCCASIONS = ['casual', 'formal', 'sport', 'party', 'work'];

export default function WardrobeScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'tops', color: '', brand: '', season: [], occasion: [] });
  const [imageUri, setImageUri] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const params = filter ? { category: filter } : {};
      const { data } = await api.get('/wardrobe', { params });
      setItems(data);
    } catch {
      Alert.alert('Error', 'Failed to load wardrobe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filter]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const toggleArr = (field, val) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(v => v !== val) : [...f[field], val],
    }));
  };

  const handleAdd = async () => {
    if (!form.name) return Alert.alert('Error', 'Name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v));
      if (imageUri) {
        fd.append('image', { uri: imageUri, type: 'image/jpeg', name: 'item.jpg' });
      }
      await api.post('/wardrobe', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(false);
      setForm({ name: '', category: 'tops', color: '', brand: '', season: [], occasion: [] });
      setImageUri('');
      fetchItems();
    } catch {
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = (id) => {
    Alert.alert('Delete', 'Remove this item?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/wardrobe/${id}`);
        setItems(items.filter(i => i._id !== id));
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemCard} onLongPress={() => deleteItem(item._id)}>
      {item.imageUrl ? (
        <Image source={{ uri: `http://localhost:5000${item.imageUrl}` }} style={styles.itemImg} />
      ) : (
        <View style={[styles.itemImg, styles.noImg]}>
          <Text style={styles.noImgText}>{item.category[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.brand || item.color}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['', ...CATEGORIES].map(c => (
          <TouchableOpacity key={c} style={[styles.filterChip, filter === c && styles.filterChipActive]} onPress={() => setFilter(c)}>
            <Text style={[styles.filterText, filter === c && styles.filterTextActive]}>{c || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={i => i._id}
          numColumns={2}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No items yet. Add your first piece!</Text>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={{ padding: 24 }}>
          <Text style={styles.modalTitle}>Add Item</Text>

          <TextInput style={styles.input} placeholder="Name *" placeholderTextColor={COLORS.muted} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
          <TextInput style={styles.input} placeholder="Color" placeholderTextColor={COLORS.muted} value={form.color} onChangeText={v => setForm(f => ({ ...f, color: v }))} />
          <TextInput style={styles.input} placeholder="Brand" placeholderTextColor={COLORS.muted} value={form.brand} onChangeText={v => setForm(f => ({ ...f, brand: v }))} />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => setForm(f => ({ ...f, category: c }))}>
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Season</Text>
          <View style={styles.chipRow}>
            {SEASONS.map(s => (
              <TouchableOpacity key={s} style={[styles.chip, form.season.includes(s) && styles.chipActive]} onPress={() => toggleArr('season', s)}>
                <Text style={[styles.chipText, form.season.includes(s) && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Occasion</Text>
          <View style={styles.chipRow}>
            {OCCASIONS.map(o => (
              <TouchableOpacity key={o} style={[styles.chip, form.occasion.includes(o) && styles.chipActive]} onPress={() => toggleArr('occasion', o)}>
                <Text style={[styles.chipText, form.occasion.includes(o) && styles.chipTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imgPreview} />
            ) : (
              <Text style={styles.imgPickerText}>📷 Add Photo</Text>
            )}
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnOutline} onPress={() => setShowModal(false)}>
              <Text style={styles.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryText}>Add to Wardrobe</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  filterBar: { maxHeight: 52, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: 'rgba(200,169,110,0.15)', borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.muted, textTransform: 'capitalize' },
  filterTextActive: { color: COLORS.primary },
  list: { padding: 12 },
  itemCard: { flex: 1, margin: 6, backgroundColor: COLORS.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  itemImg: { width: '100%', aspectRatio: 3 / 4 },
  noImg: { backgroundColor: COLORS.card2, justifyContent: 'center', alignItems: 'center' },
  noImgText: { fontSize: 36, fontWeight: '700', color: COLORS.border },
  itemInfo: { padding: 10 },
  itemName: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  itemMeta: { fontSize: 11, color: COLORS.muted, marginBottom: 6 },
  badge: { backgroundColor: COLORS.card2, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  badgeText: { fontSize: 10, color: COLORS.muted, textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 60, fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { fontSize: 28, color: '#000', fontWeight: '300', lineHeight: 32 },
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  input: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, color: COLORS.text, marginBottom: 12, fontSize: 15 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: 'rgba(200,169,110,0.15)', borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: COLORS.muted, textTransform: 'capitalize' },
  chipTextActive: { color: COLORS.primary },
  imgPicker: { height: 140, backgroundColor: COLORS.card2, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  imgPickerText: { fontSize: 16, color: COLORS.muted },
  imgPreview: { width: '100%', height: '100%' },
  modalActions: { flexDirection: 'row', gap: 12 },
  btnOutline: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  btnOutlineText: { color: COLORS.text, fontWeight: '600' },
  btnPrimary: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  btnPrimaryText: { color: '#000', fontWeight: '700' },
});
