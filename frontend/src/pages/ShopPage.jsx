import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { FiShoppingBag, FiSearch, FiStar, FiExternalLink } from 'react-icons/fi';
import './ShopPage.css';

export default function ShopPage() {
  const [gaps, setGaps] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tab, setTab] = useState('gaps');

  useEffect(() => { fetchGaps(); }, []);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/shop/suggestions');
      setGaps(data.gaps);
      setSuggestions(data.suggestions);
    } catch {
      toast.error('Failed to load shop suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const { data } = await api.get(`/shop/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
      setTab('search');
    } catch {
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const renderStoreCard = (item, idx) => (
    <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="store-card card">
      <div className="store-img">
        <img src={item.image} alt={item.title} onError={e => { e.target.style.display = 'none'; }} />
      </div>
      <div className="store-info">
        <p className="store-name">{item.store}</p>
        <p className="store-title">{item.title}</p>
        <p className="store-price">{item.price}</p>
        {item.rating && (
          <div className="store-rating">
            <FiStar className="star" />
            <span>{item.rating}</span>
            {item.reviews && <span className="review-count">({item.reviews.toLocaleString()})</span>}
          </div>
        )}
        <div className="store-link"><FiExternalLink /> Shop Now</div>
      </div>
    </a>
  );

  return (
    <div className="shop-page">
      <div className="page-header">
        <div>
          <h1>Shop</h1>
          <p className="subtitle">Fill wardrobe gaps & discover new styles</p>
        </div>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search for any clothing item..."
        />
        <button type="submit" className="btn btn-primary" disabled={searchLoading}>
          <FiSearch /> {searchLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="outfit-tabs">
        <button className={tab === 'gaps' ? 'active' : ''} onClick={() => setTab('gaps')}>
          Wardrobe Gaps {gaps.length > 0 && <span className="gap-badge">{gaps.length}</span>}
        </button>
        <button className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>Search Results</button>
      </div>

      {tab === 'gaps' && (
        loading ? <div className="spinner" /> :
        gaps.length === 0 ? (
          <div className="empty-state">
            <FiShoppingBag size={48} />
            <p>Your wardrobe looks complete! No major gaps found.</p>
          </div>
        ) : (
          suggestions.map((s, i) => (
            <div key={i} className="gap-section">
              <div className="gap-header">
                <h3 className="gap-title">{s.category}</h3>
                <span className="badge">{s.reason}</span>
              </div>
              <div className="grid-3">
                {s.stores?.map((store, j) => renderStoreCard(store, j))}
              </div>
            </div>
          ))
        )
      )}

      {tab === 'search' && (
        searchResults.length === 0 ? (
          <div className="empty-state"><p>Search for items above to see results</p></div>
        ) : (
          <div className="grid-3">
            {searchResults.map((item, i) => renderStoreCard(item, i))}
          </div>
        )
      )}
    </div>
  );
}
