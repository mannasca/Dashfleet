import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home, Truck, Wrench, AlertTriangle, LayoutDashboard, Calendar } from 'lucide-react';
import './Header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="global-header">
      <div className="header-content">
        <div className="header-left">
          <button 
            className="menu-toggle" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {menuOpen && (
            <nav className="dropdown-menu">
              <Link to="/" className="menu-item" onClick={() => setMenuOpen(false)}>
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link to="/dashboard" className="menu-item" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <Link to="/vehicles" className="menu-item" onClick={() => setMenuOpen(false)}>
                <Truck size={20} />
                <span>All Vehicles</span>
              </Link>
              <Link to="/maintenance" className="menu-item" onClick={() => setMenuOpen(false)}>
                <Wrench size={20} />
                <span>Active Maintenance</span>
              </Link>
              <Link to="/failures" className="menu-item" onClick={() => setMenuOpen(false)}>
                <AlertTriangle size={20} />
                <span>Predicted Failures</span>
              </Link>
              <Link to="/scheduling" className="menu-item" onClick={() => setMenuOpen(false)}>
                <Calendar size={20} />
                <span>Maintenance Scheduling</span>
              </Link>
            </nav>
          )}
        </div>

        <Link to="/" className="header-logo">
          <h1>DashFleet</h1>
        </Link>
      </div>
    </header>
  );
}
