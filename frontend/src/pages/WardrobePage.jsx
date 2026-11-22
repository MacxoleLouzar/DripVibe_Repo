import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../api/client';
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import './WardrobePage.css';

const CATEGORIES = ['tops', 'bottoms', 'shoes', 'accessories', 'outerwear', 'dresses'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const OCCASIONS = ['casual', 'formal', 'sport', 'party', 'work'];

export default function WardrobePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', category: 'tops', color: '', brand: '', season: [], occasion: [] });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const params = filter ? { category: filter } : {};
      const { data } = await api.get('/wardrobe', { params });
      setItems(data);
    } catch {
      toast.error('Failed to load wardrobe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filter]);

  const onDrop = useCallback((files) => {
    const file = files[0];
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  const toggleArray = (field, val) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(v => v !== val) : [...f[field], val],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
      });
      if (imageFile) fd.append('image', imageFile);
      await api.post('/wardrobe', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Item added!');
      setShowForm(false);
      setForm({ name: '', category: 'tops', color: '', brand: '', season: [], occasion: [] });
      setImageFile(null);
      setPreview('');
      fetchItems();
    } catch {
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/wardrobe/${id}`);
      setItems(items.filter(i => i.id !== id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="wardrobe-page">
      <div className="page-header">
        <div>
          <h1>My Wardrobe</h1>
          <p className="subtitle">{items.length} items</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> Add Item
        </button>
      </div>

      {showForm && (
        <div className="card add-form">
          <h3>Add Clothing Item</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. White Oxford Shirt" />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Color</label>
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="e.g. Navy Blue" />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Zara" />
              </div>
            </div>
            <div className="form-group">
              <label>Season</label>
              <div className="chip-group">
                {SEASONS.map(s => (
                  <button type="button" key={s} className={`chip ${form.season.includes(s) ? 'active' : ''}`} onClick={() => toggleArray('season', s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Occasion</label>
              <div className="chip-group">
                {OCCASIONS.map(o => (
                  <button type="button" key={o} className={`chip ${form.occasion.includes(o) ? 'active' : ''}`} onClick={() => toggleArray('occasion', o)}>{o}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Photo</label>
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                {preview ? (
                  <img src={preview} alt="preview" className="drop-preview" />
                ) : (
                  <div className="drop-placeholder">
                    <FiUpload />
                    <span>Drop image or click to upload</span>
                  </div>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add to Wardrobe'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <button className={`filter-btn ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} className={`filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <FiUpload size={48} />
          <p>Your wardrobe is empty. Add your first item!</p>
        </div>
      ) : (
        <div className="grid-4">
          {items.map(item => (
            <div key={item.id} className="wardrobe-card card">
              <div className="wardrobe-img">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} />
                ) : (
                  <div className="no-img">{item.category[0].toUpperCase()}</div>
                )}
                <button className="delete-btn" onClick={() => deleteItem(item.id)}><FiTrash2 /></button>
              </div>
              <div className="wardrobe-info">
                <p className="item-name">{item.name}</p>
                <p className="item-meta">{item.brand && `${item.brand} · `}{item.color}</p>
                <span className="badge">{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
