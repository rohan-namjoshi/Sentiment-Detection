import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">
          <span className="logo-icon" aria-label="logo" role="img">
            {/* Simple circle smile icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" stroke="#1da1f2" strokeWidth="2" fill="#fff" />
              <circle cx="10.5" cy="13" r="1" fill="#1da1f2" />
              <circle cx="17.5" cy="13" r="1" fill="#1da1f2" />
              <path d="M11.5 17c1.2 1 3.8 1 5 0" stroke="#1da1f2" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
          Sentiment<span>Detector</span>
        </h1>
      </div>
    </header>
  );
}

export default Header;
