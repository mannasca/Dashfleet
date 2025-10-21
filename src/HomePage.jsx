import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, TruckIcon, Activity, Shield, Zap } from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: <Activity size={48} />,
      title: "Predict",
      description: "Advanced AI algorithms forecast maintenance needs before issues arise"
    },
    {
      icon: <Shield size={48} />,
      title: "Maintain",
      description: "Streamlined maintenance tracking keeps your fleet running smoothly"
    },
    {
      icon: <Zap size={48} />,
      title: "Deliver",
      description: "Maximize uptime and ensure on-time deliveries every time"
    }
  ];

  return (
    <div className="home-page">
      {/* Header with Hamburger Menu */}
      <header className="home-header">
        <div className="hamburger-menu">
          <button 
            className="menu-toggle" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          
          {menuOpen && (
            <div className="dropdown-menu">
              <Link to="/dashboard" className="menu-item" onClick={() => setMenuOpen(false)}>
                <TruckIcon size={20} />
                <span>Overview Dashboard</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="logo-container">
            <h1 className="logo-text">DashFleet</h1>
          </div>
          
          <p className="slogan">
            <span className="slogan-word">Predict.</span>
            <span className="slogan-word">Maintain.</span>
            <span className="slogan-word">Deliver.</span>
          </p>

          <p className="hero-description">
            Intelligent fleet management powered by predictive analytics
          </p>

          <Link to="/dashboard" className="cta-button">
            Get Started
            <span className="arrow">→</span>
          </Link>
        </div>

        {/* Animated Background Elements */}
        <div className="animated-bg">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; 2025 DashFleet. All rights reserved.</p>
      </footer>
    </div>
  );
}
