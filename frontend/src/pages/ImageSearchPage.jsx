import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../api/client';
import { FiCamera, FiUpload, FiStar, FiExternalLink } from 'react-icons/fi';
import './ImageSearchPage.css';

export default function ImageSearchPage() {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((files) => {
    const file = files[0];
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!imageFile && !query.trim()) {
      toast.error('Upload an image or enter a description');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (imageFile) fd.append('image', imageFile);
      if (query) fd.append('query', query);
      const { data } = await api.post('/image-search', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(data.results);
      toast.success(`Found ${data.results.length} stores`);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview('');
  };

  return (
    <div className="image-search-page">
      <div className="page-header">
        <div>
          <h1>Find It</h1>
          <p className="subtitle">Upload or capture a clothing image to find it in stores</p>
        </div>
      </div>

      <div className="find-layout">
        <div className="find-input card">
          <div {...getRootProps()} className={`dropzone-large ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="uploaded" className="upload-preview" />
                <button type="button" className="clear-btn" onClick={(e) => { e.stopPropagation(); clearImage(); }}>✕ Remove</button>
              </div>
            ) : (
              <div className="drop-content">
                <FiCamera size={48} />
                <p>Drop a photo here</p>
                <span>or click to upload from your device</span>
              </div>
            )}
          </div>

          <div className="divider"><span>or describe it</span></div>

          <form onSubmit={handleSearch}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. white oversized hoodie, floral summer dress..."
            />
            <button type="submit" className="btn btn-primary find-btn" disabled={loading}>
              <FiUpload />
              {loading ? 'Searching stores...' : 'Find in Stores'}
            </button>
          </form>
        </div>

        <div className="find-results">
          {results.length === 0 ? (
            <div className="empty-state">
              <FiCamera size={48} />
              <p>Upload a photo or describe an item to find it across stores</p>
            </div>
          ) : (
            <>
              <h3 className="results-title">Found in {results.length} stores</h3>
              <div className="results-grid">
                {results.map((item, i) => (
                  <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="result-card card">
                    <div className="result-img">
                      <img src={item.image} alt={item.title} onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="result-info">
                      <p className="result-store">{item.store}</p>
                      <p className="result-title">{item.title}</p>
                      <p className="result-price">{item.price}</p>
                      {item.rating && (
                        <div className="result-rating">
                          <FiStar className="star" />
                          <span>{item.rating}</span>
                          {item.reviews && <span className="review-count">({Number(item.reviews).toLocaleString()} reviews)</span>}
                        </div>
                      )}
                      {item.storeReview && (
                        <p className="store-summary">"{item.storeReview.summary}"</p>
                      )}
                      <div className="result-link"><FiExternalLink /> View in Store</div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
