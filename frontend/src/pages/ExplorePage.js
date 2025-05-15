import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TweetList from '../components/TweetList';
import SearchPanel from '../components/SearchPanel';
import AnalysisPanel from '../components/AnalysisPanel';
import './ExplorePage.css';

function ExplorePage() {
  const [featuredCategories, setFeaturedCategories] = useState([
    { id: 1, name: 'Technology', hashtag: 'tech' },
    { id: 2, name: 'Entertainment', hashtag: 'entertainment' },
    { id: 3, name: 'Sports', hashtag: 'sports' },
    { id: 4, name: 'Science', hashtag: 'science' },
    { id: 5, name: 'Politics', hashtag: 'politics' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  useEffect(() => {
    // Load category content when component mounts or category changes
    if (selectedCategory) {
      fetchTweetsByHashtag(selectedCategory.hashtag);
    }
  }, [selectedCategory]);

  const fetchTweetsByHashtag = async (hashtag) => {
    setLoading(true);
    setError('');
    setTweets([]);

    try {
      const backendBaseUrl = 'http://localhost:5000';
      const endpoint = `/api/posts/subreddit/${hashtag}`;
      
      console.log("Fetching from:", endpoint);
      
      const response = await axios.get(`${backendBaseUrl}${endpoint}`);
      
      console.log("Response:", response.data);
      
      if (response.data && response.data.posts) {
        setTweets(response.data.posts);
        if (response.data.posts.length === 0) {
          setError('No posts found for this hashtag');
        }
      } else {
        setError('No posts found');
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const analyzeTweet = async (tweet) => {
    setSelectedTweet(tweet);
    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysisResult(null);
    setShowAnalysisPanel(true);

    try {
      // Prepare the data for analysis
      const data = {
        text: tweet.text || tweet.title || '',
        image_url: tweet.image_url || ''
      };

      console.log('Sending analysis request with data:', data);
      const response = await axios.post('http://localhost:5000/api/analyze', data);
      
      console.log('Analysis response:', response.data);
      setAnalysisResult(response.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError('Failed to analyze post. Please try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSelectTweet = (tweet) => {
    setSelectedTweet(tweet);
    setShowAnalysisPanel(true);
    analyzeTweet(tweet);
  };

  const handleCloseAnalysisPanel = () => {
    setShowAnalysisPanel(false);
  };

  // Function to handle search from SearchPanel
  const handleSearch = async (query, type) => {
    setLoading(true);
    setError('');
    setTweets([]);
    setSelectedCategory(null); // Clear category selection when searching

    try {
      const backendBaseUrl = 'http://localhost:5000';
      let endpoint;
      
      let response;
      if (type === 'username') {
        endpoint = `/api/posts/user/${query}`;
        response = await axios.get(`${backendBaseUrl}${endpoint}`);
      } else {
        // Hashtag search: use the new search endpoint
        endpoint = `/api/posts/search?query=${encodeURIComponent(query)}`;
        response = await axios.get(`${backendBaseUrl}${endpoint}`);
      }
      
      console.log("Searching from:", endpoint);
      
      if (response.data && response.data.posts) {
        setTweets(response.data.posts);
        if (response.data.posts.length === 0) {
          setError('No posts found for your search');
        }
      } else {
        setError('No posts found');
      }
    } catch (err) {
      console.error("Error searching posts:", err);
      setError(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="explore-page-container">
      <div className="left-sidebar">
        <SearchPanel 
          searchType="hashtag" 
          onSearch={handleSearch} 
          placeholder="Enter hashtag (without #)" 
          loading={loading}
        />
        <div className="featured-categories card">
          <h3>Featured Categories</h3>
          <div className="categories-container">
            {featuredCategories.map(category => (
              <div 
                key={category.id} 
                className={`category-item ${selectedCategory && selectedCategory.id === category.id ? 'selected' : ''}`} 
                onClick={() => setSelectedCategory(category)}
              >
                <span>{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        {tweets.length > 0 ? (
          <TweetList 
            tweets={tweets} 
            loading={loading} 
            error={error} 
            selectedTweet={selectedTweet}
            onSelectTweet={handleSelectTweet}
          />
        ) : error ? (
          <div className="not-found card">
            <h2>Not found</h2>
            <p>{error}</p>
          </div>
        ) : selectedCategory ? null : (
          <div className="no-selection card">
            <h2>Welcome to Explore</h2>
            <p>Select a featured category or search for a hashtag to explore posts.</p>
          </div>
        )}
      </div>

      <div className="right-sidebar">
        {showAnalysisPanel && (
          <AnalysisPanel 
            tweet={selectedTweet}
            analysisResult={analysisResult} 
            loading={analysisLoading} 
            error={analysisError} 
            onClose={handleCloseAnalysisPanel}
          />
        )}
      </div>
    </div>
  );
}

export default ExplorePage;
