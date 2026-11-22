import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiStar, FiShoppingBag, FiCamera, FiGrid } from 'react-icons/fi';
import './LandingPage.css';

const features = [
  { icon: <FiGrid />, title: 'Smart Wardrobe', desc: 'Upload your clothes and organize by category, season, and occasion.' },
  { icon: <FiStar />, title: 'Daily Outfits', desc: 'AI suggests outfits based on weather, events, and your style.' },
  { icon: <FiShoppingBag />, title: 'Shop the Gaps', desc: 'Discover what your wardrobe is missing with real store prices.' },
  { icon: <FiCamera />, title: 'Find It', desc: 'Snap or upload any clothing photo and find it across top stores.' },
];

const stores = ['ZARA', 'H&M', 'ASOS', 'Nike', 'Uniqlo', 'Nordstrom', 'Forever 21', 'Mango'];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <span className="landing-logo">Drip<span>Vibe</span></span>
        <div className="landing-nav-actions">
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('/wardrobe')}>
              Go to App <FiArrowRight />
            </button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => navigate('/auth')}>Login</button>
              <button className="btn btn-primary" onClick={() => navigate('/auth?signup=1')}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">✨ AI-Powered Style</div>
        <h1 className="hero-title">
          Dress Better,<br />Every Single Day
        </h1>
        <p className="hero-sub">
          DripVibe turns your wardrobe into a personal stylist — recommending outfits based on weather,
          events, and your unique style. Shop smarter with real store prices.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth')}>
            Start for Free <FiArrowRight />
          </button>
        </div>
        <div className="hero-stores">
          {stores.map(s => <span key={s} className="store-pill">{s}</span>)}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>Everything you need to look great</h2>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to upgrade your style?</h2>
        <p>Join DripVibe and never stress about what to wear again.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth')}>
          Create Free Account <FiArrowRight />
        </button>
      </section>

      <footer className="landing-footer">
        <span className="landing-logo">Drip<span>Vibe</span></span>
        <p>© {new Date().getFullYear()} DripVibe. All rights reserved.</p>
      </footer>
    </div>
  );
}
