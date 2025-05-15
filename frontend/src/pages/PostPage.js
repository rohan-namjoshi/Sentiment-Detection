import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function PostPage() {
  const { subreddit, post_id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentSentiment, setCommentSentiment] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true);
      try {
        const backendBaseUrl = 'http://localhost:5000';
        const response = await axios.get(`${backendBaseUrl}/api/posts/${subreddit}/${post_id}/comments`);
        setPost(response.data.post);
        setComments(response.data.comments);
      } catch (err) {
        setError('Failed to fetch post/comments');
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();
  }, [subreddit, post_id]);

  const analyzeComments = async () => {
    setAnalyzing(true);
    setCommentSentiment(null);
    try {
      const backendBaseUrl = 'http://localhost:5000';
      const commentTexts = comments.map(c => c.body).filter(Boolean);
      const response = await axios.post(`${backendBaseUrl}/api/analyze/comments`, { comments: commentTexts });
      setCommentSentiment(response.data);
    } catch (err) {
      setCommentSentiment({ error: 'Failed to analyze comments' });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div>Loading post...</div>;
  if (error) return <div>{error}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="post-page">
      <h2>{post.title}</h2>
      <p>{post.text}</p>
      <div>
        <button onClick={analyzeComments} disabled={analyzing || comments.length === 0}>
          {analyzing ? 'Analyzing...' : 'Analyze Comments Sentiment'}
        </button>
      </div>
      {commentSentiment && (
        <div className="comment-sentiment-result">
          {commentSentiment.error ? (
            <div>{commentSentiment.error}</div>
          ) : (
            <>
              <h3>Overall Comments Sentiment</h3>
              <p>Majority Sentiment: <b>{commentSentiment.majority_sentiment}</b></p>
              <p>Distribution: {Object.entries(commentSentiment.avg_distribution).map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`).join(', ')}</p>
              <p>Total Comments Analyzed: {commentSentiment.count}</p>
            </>
          )}
        </div>
      )}
      <div className="comments-section">
        <h3>Comments</h3>
        {comments.map((c, idx) => (
          <div key={c.id || idx} className="comment">
            <b>{c.author}</b>: {c.body}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostPage;
