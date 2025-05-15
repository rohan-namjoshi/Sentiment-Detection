import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './AnalysisPanel.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function AnalysisPanel({ tweet, analysisResult, loading, error, onClose }) {
  // Defensive: Only prepare chart data if analysisResult and analysisResult.distribution are valid
  const chartData = (analysisResult && analysisResult.distribution) ? {
    labels: Object.keys(analysisResult.distribution),
    datasets: [
      {
        data: Object.values(analysisResult.distribution),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',   // Negative - Red
          'rgba(255, 206, 86, 0.6)',   // Neutral - Yellow
          'rgba(75, 192, 192, 0.6)',   // Positive - Green
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  // Get sentiment color based on the sentiment result
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return '';
    
    switch(sentiment.toLowerCase()) {
      case 'positive': return 'positive';
      case 'negative': return 'negative';
      case 'neutral': return 'neutral';
      default: return '';
    }
  };

  if (!tweet) {
    return (
      <div className="analysis-panel card">
        <div className="panel-header">
          <h2 className="title">Sentiment Analysis</h2>
          {onClose && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
        <div className="no-tweet-selected">
          <p>Select a tweet to analyze its sentiment.</p>
        </div>
      </div>
    );
  }

  // Defensive: If tweet or analysisResult is null, don't try to access their properties
  if (!tweet || !analysisResult) {
    return null;
  }

  return (
    <div className="analysis-panel card">
      <div className="panel-header">
        <h2 className="title">Sentiment Analysis</h2>
        {onClose && tweet && (
          <button className="close-button" onClick={onClose} title="Close analysis">×</button>
        )}
      </div>
      
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Analyzing sentiment...</p>
        </div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : analysisResult ? (
        <div className="analysis-results">
          <div className="selected-tweet">
            <h3 className="subtitle">Selected Tweet</h3>
            <p className="tweet-text">{tweet.text}</p>
            {tweet.images && tweet.images.length > 0 && (
              <img 
                src={tweet.images[0]} 
                alt="Tweet image" 
                className="tweet-image"
              />
            )}
          </div>

          <div className="sentiment-result">
            <h3 className="subtitle">Overall Sentiment</h3>
            <div className={`sentiment-badge ${getSentimentColor(analysisResult.sentiment)}`}>
              {analysisResult.sentiment}
            </div>
            <p className="confidence">
              Confidence: {(analysisResult.confidence * 100).toFixed(2)}%
            </p>
          </div>

          <div className="sentiment-distribution">
            <h3 className="subtitle">Sentiment Distribution</h3>
            {chartData && (
              <div className="chart-container">
                <Pie data={chartData} options={chartOptions} />
              </div>
            )}
          </div>

          <div className="analysis-info">
            <h3 className="subtitle">Analysis Information</h3>
            <p>Modalities used:</p>
            <ul>
              <li>Text: {analysisResult.text_used ? '✅' : '❌'}</li>
              <li>Image: {analysisResult.image_used ? '✅' : '❌'}</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="waiting-analysis">
          <p>Tweet selected. Click "Analyze Sentiment" to begin analysis.</p>
        </div>
      )}
    </div>
  );
}

export default AnalysisPanel;
