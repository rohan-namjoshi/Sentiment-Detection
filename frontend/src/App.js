import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import TrendingPage from './pages/TrendingPage';
import PostPage from './pages/PostPage';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import './styles/theme.css';

function App() {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const searchTweets = async (query, type) => {
    setLoading(true);
    setError('');
    setTweets([]);
    setSelectedTweet(null);
    setAnalysisResult(null);

    try {
      let endpoint;
      if (type === 'username') {
        endpoint = `/api/posts/user/${query}`;
      } else if (type === 'hashtag') {
        endpoint = `/api/posts/subreddit/${query}`;
      } else if (type === 'timeline') {
        endpoint = `/api/posts/subreddit/all`;
      } else {
        setError('Invalid search type');
        setLoading(false);
        return;
      }

      // For debugging - log the endpoint
      console.log("Fetching from:", endpoint);
      
      // Use direct URL to backend instead of relative path
      const backendBaseUrl = 'http://localhost:5000';
      const response = await axios.get(`${backendBaseUrl}${endpoint}`);
      
      console.log("Full Response:", response);
      console.log("Response Data:", response.data);
      
      if (response.data && response.data.posts) {
        setTweets(response.data.posts);
        if (response.data.posts.length === 0) {
          setError('No posts found for this query');
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

  const analyzeTweet = async (tweet) => {
    setSelectedTweet(tweet);
    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      // Prepare the data for analysis
      const data = {
        text: tweet.text && tweet.text.trim() ? tweet.text : (tweet.title || ''),
        image: tweet.images && tweet.images.length > 0 ? tweet.images[0] : null
      };

      // If there's an image in the tweet, pass the URL directly to the backend
      // Backend will handle fetching and processing the image
      console.log("Analyzing post with data:", data);
      
      // Use direct URL to backend instead of relative path
      const backendBaseUrl = 'http://localhost:5000';
      const response = await axios.post(`${backendBaseUrl}/api/analyze`, data);
      setAnalysisResult(response.data);
      console.log("Analysis result:", response.data);
    } catch (err) {
      // Log full error details for debugging
      if (err && typeof err === 'object') {
        console.error("Analysis error:", err, JSON.stringify(err), err.message, err.stack);
      } else {
        console.error("Analysis error:", err);
      }
      // Show user-friendly message if error is empty or just '{}'
      let msg = '';
      if (err?.response?.data?.error) {
        msg = `Analysis error: ${err.response.data.error}`;
      } else if (err?.message) {
        msg = `Analysis error: ${err.message}`;
      } else if (typeof err === 'object' && Object.keys(err).length === 0) {
        msg = 'Analysis error: Unknown error (empty error object)';
      } else {
        msg = 'Analysis error: An unknown error occurred.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Create placeholder components for unimplemented pages
  const NotificationsPage = () => (
    <div className="placeholder-page">
      <h1>Notifications</h1>
      <p>This feature is coming soon!</p>
    </div>
  );

  const MessagesPage = () => (
    <div className="placeholder-page">
      <h1>Messages</h1>
      <p>This feature is coming soon!</p>
    </div>
  );

  const AnalyzePage = () => (
    <div className="placeholder-page">
      <h1>Sentiment Analyzer</h1>
      <p>Upload text or images to analyze sentiment</p>
      <p>This feature is coming soon!</p>
    </div>
  );

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Header />
          <div className="app-container">
            <Sidebar />
            <div className="main-container">
              <Routes>
                <Route path="/" element={
                  <HomePage 
                    tweets={tweets}
                    loading={loading}
                    error={error}
                    onAnalyze={analyzeTweet}
                    selectedTweet={selectedTweet}
                    analysisResult={analysisResult}
                    onSearch={searchTweets}
                  />
                } />
                <Route path="/explore" element={
                  <ExplorePage 
                    onSearch={searchTweets} 
                    tweets={tweets} 
                    loading={loading} 
                    error={error} 
                    onAnalyze={analyzeTweet} 
                    selectedTweet={selectedTweet} 
                    analysisResult={analysisResult} 
                  />
                } />
                <Route path="/trending" element={
                  <TrendingPage 
                    onSearch={searchTweets} 
                    tweets={tweets} 
                    loading={loading} 
                    error={error} 
                    onAnalyze={analyzeTweet} 
                    selectedTweet={selectedTweet} 
                    analysisResult={analysisResult} 
                  />
                } />
                <Route path="/posts/:subreddit/:post_id" element={<PostPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/analyze" element={<AnalyzePage />} />
              </Routes>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
