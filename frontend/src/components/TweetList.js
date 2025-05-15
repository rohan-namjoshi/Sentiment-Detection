import React, { useState } from 'react';
import './TweetList.css';
import CommentsModal from './CommentsModal';

function TweetList({ tweets, loading, error, selectedTweet, onSelectTweet }) {
  const [openCommentsPost, setOpenCommentsPost] = useState(null);
  const [openImagePost, setOpenImagePost] = useState(null);

  if (loading) {
    return (
      <div className="tweet-list card">
        <div className="loading">Loading tweets...</div>
      </div>
    );
  }

  if (error && !/Cannot read properties of null \(reading 'text'\)/.test(error)) {
    return (
      <div className="tweet-list card">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="tweet-list card">
        <div className="no-tweets">
          <p>No posts to display.</p>
          <p>Search for a username or subreddit to see posts.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="tweet-list card">
      <h2 className="title">Posts</h2>
      <div className="tweets-container">
        {tweets.map((post) => {
          // Prefer title, then text, skip if both missing
          const content = post.title || post.text;
          if (!content) return null;
          return (
            <div 
              key={post.post_id}
              className={`tweet ${selectedTweet && selectedTweet.post_id === post.post_id ? 'selected' : ''}`}
              onClick={() => onSelectTweet(post)}
            >
              <div className="tweet-header">
                <img className="profile-pic" src={post.profile_pic_url || 'https://www.redditstatic.com/avatars/avatar_default_02_24A0ED.png'} alt="Profile" />
                <div className="user-info">
                  <span className="display-name">{post.author || '[deleted]'}</span>
                  <span className="username">{post.subreddit ? `r/${post.subreddit}` : ''}</span>
                </div>
              </div>
              <div className="tweet-content">
                <p>{content}</p>
                {/* Image rendering logic: prefer images[0], then image_url, then url if image */}
                {(() => {
                  let imageUrl = null;
                  if (post.images && Array.isArray(post.images) && post.images.length > 0) {
                    imageUrl = post.images[0];
                  } else if (post.image_url) {
                    imageUrl = post.image_url;
                  } else if (post.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) {
                    imageUrl = post.url;
                  }
                  return imageUrl ? (
                    <div className="thumbnail-container" onClick={(e) => { e.stopPropagation(); setOpenImagePost({ ...post, image_url: imageUrl }); }}>
                      <img 
                        src={imageUrl} 
                        alt="Post content" 
                        className="tweet-image-thumbnail"
                      />
                      <div className="thumbnail-overlay">
                        <span>View Full Image</span>
                      </div>
                    </div>
                  ) : null;
                })()}

              </div>
              <div className="tweet-footer">
                <span className="timestamp">{post.timestamp || ''}</span>
                <button className="analyze-button" onClick={(e) => {
                  e.stopPropagation();
                  onSelectTweet(post);
                }}>
                  Analyze Sentiment
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {openCommentsPost && (
        <CommentsModal 
          post={openCommentsPost} 
          onClose={() => setOpenCommentsPost(null)} 
        />
      )}
      
      {openImagePost && (
        <div className="image-modal" onClick={() => setOpenImagePost(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={openImagePost.image_url} alt="Full size post content" className="full-image" />
            <button className="close-modal-button" onClick={() => setOpenImagePost(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TweetList;
