import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SearchPanel.css';

function SearchPanel({ onSearch }) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('username');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchType === 'username' && query.trim().length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const backendBaseUrl = 'http://localhost:5000';
          const response = await axios.get(`${backendBaseUrl}/api/users/search?query=${encodeURIComponent(query.trim())}`);
          setSuggestions(response.data.users || []);
          setShowSuggestions(true);
        } catch (err) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, searchType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    let cleanQuery = query.trim();
    if (searchType === 'username' && cleanQuery.startsWith('@')) {
      cleanQuery = cleanQuery.substring(1);
    } else if (searchType === 'hashtag' && cleanQuery.startsWith('#')) {
      cleanQuery = cleanQuery.substring(1);
    }
    setShowSuggestions(false);
    onSearch(cleanQuery, searchType);
  };

  const handleSuggestionClick = (username) => {
    setQuery(username);
    setShowSuggestions(false);
    onSearch(username, 'username');
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="search-panel card">
      <h2 className="title">Search Tweets</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="search-type">
          <label className={`search-option ${searchType === 'username' ? 'active' : ''}`}>
            <input
              type="radio"
              name="searchType"
              value="username"
              checked={searchType === 'username'}
              onChange={() => { setSearchType('username'); setSuggestions([]); }}
            />
            <span>Username</span>
          </label>
          <label className={`search-option ${searchType === 'hashtag' ? 'active' : ''}`}>
            <input
              type="radio"
              name="searchType"
              value="hashtag"
              checked={searchType === 'hashtag'}
              onChange={() => { setSearchType('hashtag'); setSuggestions([]); }}
            />
            <span>Hashtag</span>
          </label>
        </div>
        <div className="search-input-container" ref={inputRef} style={{ position: 'relative' }}>
          <input
            type="text"
            className="input search-input"
            placeholder={searchType === 'username' ? '@username' : '#hashtag'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          />
          <button type="submit" className="button search-button">
            Search
          </button>
          {searchType === 'username' && showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: '1px solid #eee', listStyle: 'none', margin: 0, padding: 0 }}>
              {suggestions.map((username, idx) => (
                <li
                  key={username + idx}
                  className="suggestion-item"
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  onClick={() => handleSuggestionClick(username)}
                >
                  @{username}
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </div>
  );
}


export default SearchPanel;
