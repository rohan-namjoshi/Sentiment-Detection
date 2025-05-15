from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import base64
from io import BytesIO
from PIL import Image
import torch
import re
import logging
import requests
from utils.reddit_scraper import get_posts_from_subreddit, get_post_and_comments, get_reddit_client
from models.advanced_multimodal_sentiment import AdvancedMultimodalSentimentAnalyzer

app = Flask(__name__)
# Initialize the sentiment analyzer
app.logger.info('Initializing sentiment analyzer...')
analyzer = AdvancedMultimodalSentimentAnalyzer()
app.logger.info('Sentiment analyzer initialized successfully')
# Enable CORS for all routes and origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Import and register analyze_comments blueprint
try:
    from analyze_comments import analyze_comments_bp
    app.register_blueprint(analyze_comments_bp)
except ImportError:
    logging.warning("analyze_comments module not found, skipping blueprint registration")

# Configure logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route('/api/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.json
    text = data.get('text', '')
    # Handle image data (base64 encoded or URL)
    image = None
    image_input = data.get('image')
    if image_input:
        try:
            if isinstance(image_input, str):
                if image_input.startswith('data:image'):
                    # Split header if present and decode base64
                    image_data = image_input.split(',')[1] if ',' in image_input else image_input
                    image_bytes = base64.b64decode(image_data)
                else:
                    # Assume image_input is a URL
                    resp = requests.get(image_input, timeout=10)
                    resp.raise_for_status()
                    image_bytes = resp.content
                image = Image.open(BytesIO(image_bytes)).convert('RGB')
            else:
                logging.warning("Unsupported image input type: %s", type(image_input))
        except Exception as e:
            logging.exception("Failed to decode image for analysis: %s", e)
            image = None
    # Analyze sentiment
    try:
        result = analyzer.analyze(text, image)
        logging.debug(f"Sentiment analysis result: {result}")
        return jsonify(result)
    except Exception as e:
        logging.exception("Analysis error: %s", e)
        return jsonify({"error": f"Analysis error: {str(e)}"}), 500

@app.route('/api/posts/user/<username>', methods=['GET'])
def get_user_posts(username):
    try:
        limit = request.args.get('limit', default=10, type=int)
        reddit = get_reddit_client()
        # Fetch posts by Redditor (user)
        redditor = reddit.redditor(username)
        posts = []
        for submission in redditor.submissions.new(limit=limit):
            posts.append({
                'post_id': submission.id,
                'title': submission.title,
                'text': submission.selftext,
                'url': submission.url,
                'images': [submission.url] if submission.url.lower().endswith(('.jpg', '.jpeg', '.png')) else [],
                'num_comments': submission.num_comments,
                'author': str(submission.author),
                'subreddit': str(submission.subreddit),
                'timestamp': int(submission.created_utc)
            })
        return jsonify({"posts": posts})
    except Exception as e:
        logging.exception(f"Failed to fetch user posts: {e}")
        return jsonify({"error": f"Failed to fetch user posts: {str(e)}"}), 500

@app.route('/api/posts/subreddit/<subreddit>', methods=['GET'])
def get_subreddit_posts(subreddit):
    try:
        limit = request.args.get('limit', default=10, type=int)
        posts = get_posts_from_subreddit(subreddit, limit)
        return jsonify({"posts": posts})
    except Exception as e:
        logging.exception(f"Failed to fetch subreddit posts: {e}")
        return jsonify({"error": f"Failed to fetch subreddit posts: {str(e)}"}), 500

@app.route('/api/posts/timeline', methods=['GET'])
def get_timeline_posts():
    try:
        limit = request.args.get('limit', default=10, type=int)
        # List of popular subreddits for timeline
        subreddits = ['all', 'news', 'worldnews', 'technology', 'funny', 'AskReddit', 'pics', 'gaming', 'science', 'movies']
        import random
        random.shuffle(subreddits)
        posts = []
        for subreddit in subreddits:
            if len(posts) >= limit:
                break
            fetched = get_posts_from_subreddit(subreddit, limit)
            posts.extend(fetched)
        random.shuffle(posts)
        posts = posts[:limit]
        return jsonify({"posts": posts})
    except Exception as e:
        logging.exception(f"Failed to fetch timeline posts: {e}")
        return jsonify({"error": f"Failed to fetch timeline posts: {str(e)}"}), 500

@app.route('/api/reddit_feed', methods=['GET'])
def reddit_feed():
    try:
        subreddit = request.args.get('subreddit', default='python', type=str)
        limit = request.args.get('limit', default=10, type=int)
        reddit = get_reddit_client()
        subreddit_obj = reddit.subreddit(subreddit)
        posts = []
        for submission in subreddit_obj.hot(limit=limit):
            posts.append({
                'post_id': submission.id,
                'title': submission.title,
                'text': submission.selftext,
                'url': submission.url,
                'images': [submission.url] if submission.url.lower().endswith(('.jpg', '.jpeg', '.png')) else [],
                'num_comments': submission.num_comments
            })
        return jsonify({'posts': posts})
    except Exception as e:
        logging.exception(f"Failed to fetch subreddit posts: {e}")
        return jsonify({'error': f'Failed to fetch subreddit posts: {str(e)}'}), 500

@app.route('/api/posts/<subreddit>/<post_id>/comments', methods=['GET'])
def get_post_and_comments(subreddit, post_id):
    try:
        reddit = get_reddit_client()
        submission = reddit.submission(id=post_id)
        # Extract images: support gallery, preview, and direct image url
        images = []
        if hasattr(submission, 'is_gallery') and submission.is_gallery:
            if hasattr(submission, 'media_metadata') and submission.media_metadata:
                for item in submission.media_metadata.values():
                    if 's' in item and 'u' in item['s']:
                        images.append(item['s']['u'].replace('&amp;', '&'))
        elif hasattr(submission, 'preview') and 'images' in submission.preview:
            for img in submission.preview['images']:
                if 'source' in img and 'url' in img['source']:
                    images.append(img['source']['url'].replace('&amp;', '&'))
        # Fallback to main url if it's an image
        if submission.url.lower().endswith(('.jpg', '.jpeg', '.png')):
            images.append(submission.url)
        # Remove duplicates
        images = list(dict.fromkeys(images))
        post = {
            'post_id': submission.id,
            'title': submission.title,
            'text': submission.selftext,
            'url': submission.url,
            'images': images,
            'num_comments': submission.num_comments,
            'author': str(submission.author),
            'subreddit': str(submission.subreddit),
            'timestamp': int(submission.created_utc)
        }
        submission.comments.replace_more(limit=0)
        comments = []
        for comment in submission.comments.list():
            comments.append({
                'id': comment.id,
                'author': str(comment.author),
                'text': comment.body
            })
        return jsonify({'post': post, 'comments': comments})
    except Exception as e:
        logging.exception(f"Failed to fetch post/comments: {e}")
        return jsonify({'error': f'Failed to fetch post/comments: {str(e)}'}), 500

@app.route('/api/posts/search', methods=['GET'])
def search_posts():
    query = request.args.get('query', '').strip()
    limit = request.args.get('limit', default=20, type=int)
    if not query:
        return jsonify({'posts': [], 'error': 'Query required'}), 400
    reddit = get_reddit_client()
    # Search in a set of popular subreddits
    subreddits = ['all', 'news', 'worldnews', 'technology', 'funny', 'AskReddit', 'pics', 'gaming', 'science', 'movies']
    posts = []
    for subreddit in subreddits:
        try:
            subreddit_obj = reddit.subreddit(subreddit)
            for submission in subreddit_obj.new(limit=30):
                if (query.lower() in (submission.title or '').lower()) or (query.lower() in (submission.selftext or '').lower()):
                    posts.append({
                        'post_id': submission.id,
                        'title': submission.title,
                        'text': submission.selftext,
                        'url': submission.url,
                        'images': [submission.url] if submission.url.lower().endswith(('.jpg', '.jpeg', '.png')) else [],
                        'num_comments': submission.num_comments,
                        'author': str(submission.author),
                        'subreddit': str(submission.subreddit),
                        'timestamp': int(submission.created_utc)
                    })
                    if len(posts) >= limit:
                        break
            if len(posts) >= limit:
                break
        except Exception as e:
            logging.warning(f"Failed to search subreddit {subreddit}: {e}")
    return jsonify({'posts': posts[:limit]})

@app.route('/api/users/search', methods=['GET'])
def search_users():
    query = request.args.get('query', '').strip()
    limit = request.args.get('limit', default=10, type=int)
    if not query:
        return jsonify({'users': [], 'error': 'Query required'}), 400
    reddit = get_reddit_client()
    users = []
    try:
        # Reddit's user search is not public API, but we can try to fetch users by searching in 'all' and collecting authors
        subreddit = reddit.subreddit('all')
        authors = set()
        for submission in subreddit.new(limit=200):
            author = str(submission.author)
            if author and query.lower() in author.lower():
                authors.add(author)
            if len(authors) >= limit:
                break
        users = list(authors)[:limit]
    except Exception as e:
        logging.warning(f"Failed to search users: {e}")
    return jsonify({'users': users})

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
