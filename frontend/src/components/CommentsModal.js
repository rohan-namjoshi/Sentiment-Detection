import React, { useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import './CommentsModal.css';
Chart.register(ArcElement, Tooltip, Legend);

function CommentsModal({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  React.useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError('');
      try {
        const backendBaseUrl = 'http://localhost:5000';
        const response = await axios.get(`${backendBaseUrl}/api/posts/${post.subreddit}/${post.post_id}/comments`);
        setComments(response.data.comments);
      } catch (err) {
        setError('Failed to fetch comments');
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [post]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setSentiment(null);
    try {
      const backendBaseUrl = 'http://localhost:5000';
      const commentTexts = comments.map(c => c.text).filter(Boolean);
      const response = await axios.post(`${backendBaseUrl}/api/analyze/comments`, { comments: commentTexts });
      setSentiment(response.data);
    } catch (err) {
      setSentiment({ error: 'Failed to analyze comments' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="comments-modal-overlay">
      <div className="comments-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>Comments</h3>
        {loading ? (
          <div>Loading comments...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <>
            <div className="comments-list">
              {comments.map((c, idx) => (
                <div key={c.id || idx} className="comment-item">
                  <b>{c.author}</b>: {c.text}
                </div>
              ))}
            </div>
            <button className="analyze-btn" onClick={handleAnalyze} disabled={analyzing || comments.length === 0}>
              {analyzing ? 'Analyzing...' : 'Analyze Comments'}
            </button>
            {sentiment && !sentiment.error && (
              <div className="sentiment-chart-container">
                <h4>Sentiment Distribution</h4>
                <Pie 
                  data={{
                    labels: Object.keys(sentiment.avg_distribution),
                    datasets: [{
                      data: Object.values(sentiment.avg_distribution),
                      backgroundColor: ['#ff6384', '#ffcd56', '#36a2eb'],
                    }]
                  }}
                  options={{
                    plugins: {
                      legend: { display: true, position: 'bottom' }
                    }
                  }}
                />
                <div className="sentiment-majority">
                  Majority: <b>{sentiment.majority_sentiment}</b> &nbsp;|&nbsp; Total: {sentiment.count}
                </div>
              </div>
            )}
            {sentiment && sentiment.error && (
              <div className="sentiment-error">{sentiment.error}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CommentsModal;
