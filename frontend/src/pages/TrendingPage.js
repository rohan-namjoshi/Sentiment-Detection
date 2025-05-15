 import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TrendingPage.css';
import TweetList from '../components/TweetList';
import AnalysisPanel from '../components/AnalysisPanel';

function TrendingPage() {
  const [trendingTopics, setTrendingTopics] = useState([
    { id: 1, name: 'all' },
    { id: 2, name: 'news' },
    { id: 3, name: 'worldnews' },
    { id: 4, name: 'technology' }, 
    
    { id: 5, name: 'funny' },
    { id: 6, name: 'AskReddit' },
    { id: 7, name: 'pics' },
    { id: 8, name: 'gaming' },
    { id: 9, name: 'science' },
    { id: 10, name: 'movies' }
  ]);
  
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  useEffect(() => {
    // Load trending topic content when component mounts or topic changes
    if (selectedTopic) {
      fetchTweetsByHashtag(selectedTopic.name);
    }
  }, [selectedTopic]);

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
          setError('No posts found for this trending topic');
        }
      } else {
        setError('No posts found');
      }
    } catch (err) {
      console.error("Error fetching tweets:", err);
      setError(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
  };

  const analyzeTweet = async (tweet) => {
    setSelectedTweet(tweet);
    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysisResult(null);

    try {
      // Prepare the data for analysis
      const data = {
        text: tweet.text && tweet.text.trim() ? tweet.text : (tweet.title || ''),
        image: tweet.images && tweet.images.length > 0 ? tweet.images[0] : null
      };

      // If there's an image in the tweet, we need to fetch it and convert to base64 (browser-safe)
      if (data.image) {
        try {
          data.image = await getBase64FromUrl(data.image);
        } catch (imgError) {
          console.error('Error fetching image:', imgError);
          data.image = null; // If image cannot be fetched, analyze text only
        }
      }
      // Helper for browser-safe base64 encoding
      async function getBase64FromUrl(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // Use direct URL to backend instead of relative path
      const backendBaseUrl = 'http://localhost:5000';
      const response = await fetch(`${backendBaseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisError(`Analysis error: ${err.message}`);
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

  return (
    <div className="trending-page-container">
      <div className="left-sidebar">
        <div className="trending-topics card">
          <h3>Trending Topics</h3>
          <div className="topics-container">
            {trendingTopics.map(topic => (
              <div 
                key={topic.id} 
                className={`topic-item ${selectedTopic && selectedTopic.id === topic.id ? 'selected' : ''}`} 
                onClick={() => setSelectedTopic(topic)}
              >
                <span>r/{topic.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        {selectedTopic ? (
          <TweetList 
            tweets={tweets} 
            loading={loading} 
            error={error} 
            selectedTweet={selectedTweet}
            onSelectTweet={handleSelectTweet}
          />
        ) : (
          <div className="no-selection card">
            <h2>What's Trending</h2>
            <p>Select a trending topic to see popular posts.</p>
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

export default TrendingPage;
