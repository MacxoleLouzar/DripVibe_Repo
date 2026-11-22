import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiStar, FiShoppingBag, FiCamera, FiLogOut } from 'react-icons/fi';
import './Layout.css';

const navItems = [
  { to: '/app/wardrobe', icon: <FiGrid />, label: 'Wardrobe' },
  { to: '/app/outfit', icon: <FiStar />, label: 'Outfits' },
  { to: '/app/shop', icon: <FiShoppingBag />, label: 'Shop' },
  { to: '/app/image-search', icon: <FiCamera />, label: 'Find It' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">Drip<span>Vibe</span></span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <span>{user?.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
