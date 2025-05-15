import React, { useEffect } from 'react';
import TweetList from '../components/TweetList';
import AnalysisPanel from '../components/AnalysisPanel';
import './HomePage.css';

function HomePage({ 
  tweets, 
  loading, 
  error, 
  selectedTweet, 
  analysisResult,
  onAnalyze,
  onSearch
}) {
  // Handler to close the analysis panel
  const handleCloseAnalysis = () => {
    onAnalyze(null);
  };
  // Load random timeline tweets when the component mounts
  useEffect(() => {
    if (tweets.length === 0 && !loading) {
      // Fetch random timeline tweets from backend
      onSearch(null, 'timeline');
    }
  }, []);

  const analysisActive = !!selectedTweet;
  return (
    <div className={`home-page${analysisActive ? ' analysis-active' : ''}`}>
      <div className="timeline-container">
        <h1 className="page-title">Home</h1>

        <TweetList 
          tweets={tweets} 
          loading={loading} 
          error={error}
          selectedTweet={selectedTweet}
          onSelectTweet={onAnalyze}
        />
      </div>
      <div className="analysis-container">
        <AnalysisPanel 
          tweet={selectedTweet} 
          analysisResult={analysisResult}
          loading={loading}
          error={error}
          onClose={handleCloseAnalysis}
        />
      </div>
    </div>
  );
}

export default HomePage;
