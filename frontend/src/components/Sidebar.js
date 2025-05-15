import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
          <div className="nav-icon">
            <svg viewBox="0 0 24 24">
              <g>
                <path d="M22.46 7.57L12.357 2.115c-.223-.12-.49-.12-.713 0L1.543 7.57c-.364.197-.5.652-.303 1.017.135.25.394.393.66.393.12 0 .243-.03.356-.09l.815-.44L4.7 19.963c.214 1.215 1.308 2.062 2.658 2.062h9.282c1.352 0 2.445-.848 2.663-2.087l1.626-11.49.818.442c.364.193.82.06 1.017-.304.196-.363.06-.818-.304-1.016zm-4.638 12.133c-.107.606-.703.822-1.18.822H7.36c-.48 0-1.075-.216-1.178-.798L4.48 7.69 12 3.628l7.522 4.06-1.7 12.015z"></path>
                <path d="M8.22 12.184c0 2.084 1.695 3.78 3.78 3.78s3.78-1.696 3.78-3.78-1.695-3.78-3.78-3.78-3.78 1.696-3.78 3.78zm6.06 0c0 1.258-1.022 2.28-2.28 2.28s-2.28-1.022-2.28-2.28 1.022-2.28 2.28-2.28 2.28 1.022 2.28 2.28z"></path>
              </g>
            </svg>
          </div>
          <span className="nav-text">Home</span>
        </Link>
        <Link to="/explore" className={`nav-item ${path === '/explore' ? 'active' : ''}`}>
          <div className="nav-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <polygon points="16,8 14,14 8,16 10,10" fill="#1da1f2" stroke="#1da1f2" strokeWidth="1"/>
            </svg>
          </div>
          <span className="nav-text">Explore</span>
        </Link>
        <Link to="/trending" className={`nav-item ${path === '/trending' ? 'active' : ''}`}>
          <div className="nav-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 18c2.21-2.21 2.21-5.79 0-8l-5-5-5 5c-2.21 2.21-2.21 5.79 0 8 2.21 2.21 5.79 2.21 8 0z" fill="#ff9800" stroke="#ff9800"/>
              <path d="M12 10v6" stroke="#fff" strokeWidth="2"/>
              <circle cx="12" cy="17" r="1" fill="#fff"/>
            </svg>
          </div>
          <span className="nav-text">Trending</span>
        </Link>
      </nav>
      
      <Link to="/analyze" className="analyze-button" title="Analyze">
        {/* Logo icon - smiley face SVG */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white"/>
          <circle cx="9" cy="10" r="1.2" fill="#1da1f2"/>
          <circle cx="15" cy="10" r="1.2" fill="#1da1f2"/>
          <path d="M8.5 15c1.5 1.2 5.5 1.2 7 0" stroke="#1da1f2" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="analyze-button-text">Analyze</span>
      </Link>
    </div>
  );
}

export default Sidebar;
