import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import {
  FiRefreshCw, FiHeart, FiSave, FiCloud, FiShoppingBag,
  FiExternalLink, FiStar, FiUser, FiX, FiEdit2, FiCheck,
} from 'react-icons/fi';
import './OutfitPage.css';

const OCCASIONS = ['casual', 'formal', 'sport', 'party', 'work'];
const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const imgSrc = (url) => (!url ? '' : url.startsWith('http') ? url : `${BACKEND}${url}`);
const todayStr = () => new Date().toISOString().split('T')[0];
const nowTimeStr = () => new Date().toTimeString().slice(0, 5);

function getBodyShape(gender, bmi, bodyFat) {
  if (gender === 'female') {
    if (bodyFat < 20 && bmi < 22) return 'slim';
    if (bodyFat < 28 && bmi < 26) return 'athletic';
    if (bodyFat < 35) return 'average';
    return 'curvy';
  }
  if (bodyFat < 12 && bmi < 22) return 'slim';
  if (bodyFat < 18 && bmi < 26) return 'athletic';
  if (bodyFat < 25) return 'average';
  return 'heavy';
}

const ZONE_MAP = {
  top: 'top', shirt: 'top', blouse: 'top', tshirt: 'top', 't-shirt': 'top',
  sweater: 'top', hoodie: 'top', jacket: 'top', coat: 'top', vest: 'top',
  dress: 'dress', jumpsuit: 'dress', romper: 'dress',
  pants: 'bottom', jeans: 'bottom', trousers: 'bottom', shorts: 'bottom',
  skirt: 'bottom', leggings: 'bottom',
  shoes: 'shoes', sneakers: 'shoes', boots: 'shoes', heels: 'shoes',
  sandals: 'shoes', loafers: 'shoes',
  hat: 'hat', cap: 'hat', beanie: 'hat',
};

function resolveZones(items) {
  const zones = {};
  (items || []).forEach(item => {
    const key = item.category?.toLowerCase().replace(/\s+/g, '');
    const zone = ZONE_MAP[key] || ZONE_MAP[item.category?.toLowerCase()] || null;
    if (zone && !zones[zone]) zones[zone] = imgSrc(item.image_url);
  });
  return zones;
}

function Mannequin({ gender, shape, outfitItems }) {
  const isFemale = gender === 'female';
  const zones = resolveZones(outfitItems);
  const w = { slim: 0.82, athletic: 0.95, average: 1.0, curvy: 1.1, heavy: 1.18 }[shape] || 1;

  return (
    <div className="figure-wrap">
      <div className={`figure figure--${shape} figure--${gender}`} style={{ '--w': w }}>
        <div className="fig-head">
          <div className="fig-face">
            <div className="fig-eye fig-eye--l" />
            <div className="fig-eye fig-eye--r" />
            <div className="fig-mouth" />
          </div>
          <div className={`fig-hair fig-hair--${gender}`} />
          {zones.hat && <img src={zones.hat} alt="hat" className="cloth-hat" />}
        </div>
        <div className="fig-neck" />
        <div className="fig-upper">
          <div className="fig-arm fig-arm--l" />
          <div className="fig-torso">
            {zones.dress && <img src={zones.dress} alt="dress" className="cloth-dress" />}
            {!zones.dress && zones.top && <img src={zones.top} alt="top" className="cloth-top" />}
            {!zones.dress && !zones.top && (
              <div className="cloth-default-top" style={{ background: isFemale ? '#c890b0' : '#5878c8' }} />
            )}
          </div>
          <div className="fig-arm fig-arm--r" />
        </div>
        <div className="fig-waist" />
        <div className="fig-lower">
          <div className="fig-hips">
            {!zones.dress && zones.bottom && <img src={zones.bottom} alt="bottom" className="cloth-bottom" />}
            {!zones.dress && !zones.bottom && (
              <div className="cloth-default-bottom" style={{ background: isFemale ? '#8050a0' : '#2a4a8a' }} />
            )}
          </div>
          <div className="fig-legs">
            <div className="fig-leg fig-leg--l" />
            <div className="fig-leg fig-leg--r" />
          </div>
        </div>
        <div className="fig-feet">
          <div className="fig-foot fig-foot--l">
            {zones.shoes ? <img src={zones.shoes} alt="shoes" className="cloth-shoe" /> : <div className="cloth-default-shoe" />}
          </div>
          <div className="fig-foot fig-foot--r">
            {zones.shoes ? <img src={zones.shoes} alt="shoes" className="cloth-shoe" /> : <div className="cloth-default-shoe" />}
          </div>
        </div>
      </div>
      <div className="figure-label">
        <span>{shape}</span>
        <span className="figure-gender">{isFemale ? '♀' : '♂'}</span>
      </div>
    </div>
  );
}

function ItemEditPanel({ item, onRegenerate, onClose }) {
  const [desc, setDesc] = useState(item.description || '');
  const [loading, setLoading] = useState(false);

  const handleRegen = async () => {
    setLoading(true);
    try { await onRegenerate(item, desc); } finally { setLoading(false); }
  };

  return (
    <div className="item-edit-panel">
      <div className="item-edit-header">
        <span>Edit · <em>{item.category}</em></span>
        <button className="icon-btn-sm" onClick={onClose}><FiX /></button>
      </div>
      <textarea
        className="item-edit-desc"
        rows={3}
        placeholder="e.g. 'something more formal in navy blue'"
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />
      <button className="btn btn-primary item-regen-btn" onClick={handleRegen} disabled={loading}>
        <FiRefreshCw className={loading ? 'spin' : ''} />
        {loading ? 'Regenerating…' : 'Regenerate this item'}
      </button>
    </div>
  );
}

function BodyVisualizerModal({ gender, onClose, onApply }) {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [bodyFat, setBodyFat] = useState(20);

  const bmi = weight / ((height / 100) ** 2);
  const shape = getBodyShape(gender, bmi, bodyFat);

  const shapeDesc = {
    slim: 'Lean & slender frame', athletic: 'Toned, muscular build',
    average: 'Balanced proportions', curvy: 'Fuller, curvy silhouette', heavy: 'Broader, heavier build',
  };

  const sliders = [
    { label: 'Height', unit: 'cm', val: height, set: setHeight, min: 140, max: 220 },
    { label: 'Weight', unit: 'kg', val: weight, set: setWeight, min: 40, max: 160 },
    { label: 'Body Fat', unit: '%', val: bodyFat, set: setBodyFat, min: 5, max: 50 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FiUser /> Body Visualizer</h3>
          <button className="icon-btn" onClick={onClose}><FiX /></button>
        </div>
        <div className="body-viz-content">
          <div className="body-viz-controls">
            {sliders.map(({ label, unit, val, set, min, max }) => (
              <div className="viz-slider-group" key={label}>
                <label>{label} <span>{val}{unit}</span></label>
                <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} />
                <div className="range-ends"><span>{min}</span><span>{max}</span></div>
              </div>
            ))}
            <div className="viz-stats">
              <div className="viz-stat"><span className="viz-stat-val">{bmi.toFixed(1)}</span><span className="viz-stat-lbl">BMI</span></div>
              <div className="viz-stat"><span className="viz-stat-val">{bodyFat}%</span><span className="viz-stat-lbl">Body Fat</span></div>
              <div className="viz-stat"><span className="viz-stat-val">{height}cm</span><span className="viz-stat-lbl">Height</span></div>
            </div>
            <div className="viz-shape-result">
              <span className="shape-tag">{shape}</span>
              <p>{shapeDesc[shape]}</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}
              onClick={() => onApply({ height, weight, bodyFat, bmi, shape })}>
              Apply to Outfit
            </button>
          </div>
          <div className="body-viz-preview">
            <Mannequin gender={gender} shape={shape} outfitItems={[]} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OutfitPage() {
  const [weather, setWeather]         = useState(null);
  const [city, setCity]               = useState('');
  const [date, setDate]               = useState(todayStr());
  const [time, setTime]               = useState(nowTimeStr());
  const [event, setEvent]             = useState('casual');
  const [gender, setGender]           = useState('male');
  const [mode, setMode]               = useState('wardrobe');
  const [suggested, setSuggested]     = useState([]);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [tab, setTab]                 = useState('suggest');
  const [bodyData, setBodyData]       = useState(null);
  const [showBodyViz, setShowBodyViz] = useState(false);
  const [editingId, setEditingId]     = useState(null);

  useEffect(() => { fetchSaved(); }, []);

  useEffect(() => {
    if (suggested.length > 0) regenerate();
  }, [gender, mode, event]);

  const fetchSaved = async () => {
    try { const { data } = await api.get('/outfit'); setSavedOutfits(data); } catch {}
  };

  const doSuggest = async (freshWeather, overrides = {}) => {
    setLoading(true);
    setEditingId(null);
    try {
      const { data } = await api.post('/outfit/suggest', {
        weather: freshWeather,
        event:     overrides.event     ?? event,
        gender:    overrides.gender    ?? gender,
        mode:      overrides.mode      ?? mode,
        bodyShape: overrides.bodyShape ?? bodyData?.shape,
      });
      setSuggested(data.outfit);
      if (!data.outfit.length) toast('No items found. Try AI mode or add more to your wardrobe!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to suggest outfit');
    } finally { setLoading(false); }
  };

  const regenerate = async () => {
    let freshWeather = weather;
    if (city) {
      try {
        const { data } = await api.get('/weather', { params: { city, date, time } });
        setWeather(data);
        freshWeather = data;
      } catch {}
    }
    await doSuggest(freshWeather);
  };

  const fetchWeather = async () => {
    if (!city) return toast.error('Enter a city first');
    try {
      const { data } = await api.get('/weather', { params: { city, date, time } });
      setWeather(data);
      toast.success(`Weather loaded for ${data.city}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not fetch weather');
    }
  };

  const applyBodyData = (d) => {
    setBodyData(d);
    setShowBodyViz(false);
    toast.success(`Body shape: ${d.shape}`);
    if (suggested.length > 0) setTimeout(() => doSuggest(weather), 0);
  };

  const regenerateItem = async (item, description) => {
    try {
      const { data } = await api.post('/outfit/suggest-item', {
        category: item.category, description, weather, event, gender, mode, bodyShape: bodyData?.shape,
      });
      setSuggested(prev => prev.map(i => i.id === item.id ? { ...data.item } : i));
      setEditingId(null);
      toast.success(`${item.category} updated!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not regenerate item');
    }
  };

  const saveOutfit = async () => {
    if (!suggested.length) return;
    try {
      await api.post('/outfit/save', {
        items: suggested.filter(i => !i.isAI).map(i => i.id),
        occasion: event, weather: weather?.description, event,
      });
      toast.success('Outfit saved!');
      fetchSaved();
    } catch { toast.error('Failed to save'); }
  };

  const toggleFavorite = async (id) => {
    try {
      const { data } = await api.patch(`/outfit/${id}/favorite`);
      setSavedOutfits(savedOutfits.map(o => o.id === id ? data : o));
    } catch {}
  };

  const deleteOutfit = async (id) => {
    try {
      await api.delete(`/outfit/${id}`);
      setSavedOutfits(savedOutfits.filter(o => o.id !== id));
      toast.success('Deleted');
    } catch {}
  };

  const isToday = date === todayStr();

  return (
    <div className="outfit-page">
      {showBodyViz && (
        <BodyVisualizerModal gender={gender} onClose={() => setShowBodyViz(false)} onApply={applyBodyData} />
      )}

      <div className="page-header">
        <div>
          <h1>Outfit Suggestions</h1>
          <p className="subtitle">AI-powered daily outfit recommendations</p>
        </div>
      </div>

      <div className="outfit-tabs">
        <button className={tab === 'suggest' ? 'active' : ''} onClick={() => setTab('suggest')}>Suggest</button>
        <button className={tab === 'saved' ? 'active' : ''} onClick={() => setTab('saved')}>Saved ({savedOutfits.length})</button>
      </div>

      {tab === 'suggest' && (
        <div className="suggest-section">
          <div className="card controls-card">

            <div className="gender-body-row">
              <div className="form-group">
                <label>Gender</label>
                <div className="gender-toggle">
                  <button type="button" className={`gender-btn ${gender === 'male' ? 'active' : ''}`} onClick={() => setGender('male')}>👨 Male</button>
                  <button type="button" className={`gender-btn ${gender === 'female' ? 'active' : ''}`} onClick={() => setGender('female')}>👩 Female</button>
                </div>
              </div>
              <div className="form-group">
                <label>Body Profile</label>
                <button type="button" className="btn btn-outline body-viz-btn" onClick={() => setShowBodyViz(true)}>
                  <FiUser />
                  {bodyData ? `${bodyData.shape} · ${bodyData.height}cm · ${bodyData.weight}kg` : 'Set Body Measurements'}
                </button>
                {bodyData && <span className="body-shape-chip">{bodyData.shape} · BMI {bodyData.bmi.toFixed(1)} · {bodyData.bodyFat}% fat</span>}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Outfit Source</label>
              <div className="mode-toggle">
                <button type="button" className={`mode-btn ${mode === 'wardrobe' ? 'active' : ''}`} onClick={() => setMode('wardrobe')}>👗 My Wardrobe</button>
                <button type="button" className={`mode-btn ${mode === 'ai' ? 'active' : ''}`} onClick={() => setMode('ai')}>✨ AI Generated</button>
              </div>
              {mode === 'ai' && <p className="mode-hint">AI will suggest a complete outfit with store links and prices based on your gender, occasion & weather.</p>}
            </div>

            <div className="weather-row" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Durban" onKeyDown={e => e.key === 'Enter' && fetchWeather()} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
              <div className="form-group weather-btn-group">
                <label>&nbsp;</label>
                <button className="btn btn-outline weather-btn" onClick={fetchWeather}>
                  <FiCloud /> {isToday && time === nowTimeStr() ? 'Now' : 'Forecast'}
                </button>
              </div>
            </div>

            {weather && (
              <div className="weather-result">
                <div className="weather-icon-big">{weather.icon}</div>
                <div className="weather-details">
                  <p className="weather-city">{weather.city}</p>
                  <p className="weather-temp">{Math.round(weather.temp)}°C <span>Feels like {Math.round(weather.feels_like)}°C</span></p>
                  <p className="weather-desc">{weather.description}</p>
                  <div className="weather-meta">
                    <span>💧 {weather.humidity}%</span>
                    <span>💨 {weather.wind} m/s</span>
                    <span>📅 {weather.date} {weather.time}</span>
                    {weather.isForecast && <span className="badge badge-gold">Forecast</span>}
                  </div>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Occasion / Event</label>
              <div className="chip-group">
                {OCCASIONS.map(o => (
                  <button key={o} type="button" className={`chip ${event === o ? 'active' : ''}`} onClick={() => setEvent(o)}>{o}</button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary suggest-btn" onClick={regenerate} disabled={loading}>
              <FiRefreshCw className={loading ? 'spin' : ''} />
              {loading ? 'Generating...' : `Generate ${mode === 'ai' ? 'AI ' : ''}Outfit`}
            </button>
          </div>

          {suggested.length > 0 && (
            <div className="suggested-outfit">
              <div className="suggested-header">
                <div>
                  <h3>{mode === 'ai' ? '✨ AI Outfit' : "Today's Look"}</h3>
                  <p className="suggested-meta">
                    {gender === 'male' ? '👨 Male' : '👩 Female'} · {event}
                    {weather && ` · ${Math.round(weather.temp)}°C`}
                    {bodyData && ` · ${bodyData.shape}`}
                  </p>
                </div>
                {mode === 'wardrobe' && (
                  <button className="btn btn-outline" onClick={saveOutfit}><FiSave /> Save</button>
                )}
              </div>

              <div className="outfit-result-layout">
                <div className="outfit-mannequin-panel">
                  <Mannequin gender={gender} shape={bodyData?.shape || 'average'} outfitItems={suggested} />
                </div>

                <div className="outfit-items-panel">
                  {mode === 'ai' ? (
                    <div className="ai-outfit-grid">
                      {suggested.map(item => (
                        <div key={item.id} className="ai-item-card card">
                          <div className="ai-item-img">
                            <img src={imgSrc(item.image_url)} alt={item.name} />
                            <span className="ai-category-badge">{item.category}</span>
                            <button className="item-edit-trigger" onClick={() => setEditingId(editingId === item.id ? null : item.id)}>
                              {editingId === item.id ? <FiCheck /> : <FiEdit2 />}
                            </button>
                          </div>
                          <div className="ai-item-info">
                            <p className="ai-item-name">{item.name}</p>
                            <p className="ai-item-desc">{item.description}</p>
                            <div className="ai-item-store">
                              <span className="store-label">{item.store}</span>
                              <span className="ai-price">{item.price}</span>
                            </div>
                            <div className="ai-rating">
                              <FiStar className="star" /><span>{item.rating}</span>
                              <span className="review-count">({item.reviews?.toLocaleString()})</span>
                            </div>
                            <a href={item.storeLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline buy-btn">
                              <FiShoppingBag /> Buy at {item.store} <FiExternalLink />
                            </a>
                          </div>
                          {editingId === item.id && (
                            <ItemEditPanel item={item} onRegenerate={regenerateItem} onClose={() => setEditingId(null)} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="outfit-items">
                      {suggested.map(item => (
                        <div key={item.id} className="outfit-item card">
                          <div className="outfit-item-img">
                            {item.image_url
                              ? <img src={imgSrc(item.image_url)} alt={item.name} />
                              : <div className="no-img">{item.category[0].toUpperCase()}</div>
                            }
                            <button className="item-edit-trigger" onClick={() => setEditingId(editingId === item.id ? null : item.id)}>
                              {editingId === item.id ? <FiCheck /> : <FiEdit2 />}
                            </button>
                          </div>
                          <p className="item-name">{item.name}</p>
                          <span className="badge">{item.category}</span>
                          {editingId === item.id && (
                            <ItemEditPanel item={item} onRegenerate={regenerateItem} onClose={() => setEditingId(null)} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div className="saved-section">
          {savedOutfits.length === 0 ? (
            <div className="empty-state"><p>No saved outfits yet. Generate and save one!</p></div>
          ) : (
            savedOutfits.map(outfit => (
              <div key={outfit.id} className="card saved-outfit">
                <div className="saved-outfit-header">
                  <div>
                    <p className="outfit-name">{outfit.name}</p>
                    <p className="outfit-meta">{outfit.occasion} · {outfit.weather}</p>
                  </div>
                  <div className="outfit-actions">
                    <button className={`icon-btn ${outfit.is_favorite ? 'fav' : ''}`} onClick={() => toggleFavorite(outfit.id)}><FiHeart /></button>
                    <button className="icon-btn danger" onClick={() => deleteOutfit(outfit.id)}>✕</button>
                  </div>
                </div>
                <div className="saved-items">
                  {outfit.items?.map(item => (
                    <div key={item.id} className="saved-item-thumb">
                      {item.image_url
                        ? <img src={imgSrc(item.image_url)} alt={item.name} />
                        : <div className="no-img-sm">{item.category?.[0]?.toUpperCase()}</div>
                      }
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
