import requests
import feedparser
import itertools
import json

# Enable debug logging
DEBUG_MODE = True

def debug_log(message):
    if DEBUG_MODE:
        print(f"[DEBUG] {message}")

# List of public Nitter instances for rotation
NITTER_INSTANCES = [
    "https://xcancel.com/",
    "https://nitter.net",
    "https://nitter.privacydev.net",
    "https://nitter.1d4.us",
    "https://nitter.42l.fr",
    "https://nitter.moomoo.me",
    "https://nitter.pussthecat.org",
    "https://nitter.unixfox.eu",
]

nitter_cycle = itertools.cycle(NITTER_INSTANCES)

def fetch_from_nitter(path, limit=10):
    """Try all Nitter instances in rotation until one succeeds."""
    errors = []
    for _ in range(len(NITTER_INSTANCES)):
        base_url = next(nitter_cycle)
        url = f"{base_url}{path}"
        try:
            debug_log(f"Trying Nitter instance: {url}")
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            feed = feedparser.parse(response.content)
            return feed.entries[:limit]
        except Exception as e:
            debug_log(f"Nitter instance failed: {base_url} ({str(e)})")
            errors.append((base_url, str(e)))
            continue
    debug_log(f"All Nitter instances failed: {errors}")
    raise Exception("All Nitter instances failed")

def sanitize_hashtag(hashtag):
    """Ensure hashtag does not start with # or ##."""
    if hashtag.startswith('#'):
        return hashtag.lstrip('#')
    return hashtag

def get_tweets_by_username(username, limit=10):
    """Fetch tweets by username using Nitter RSS with instance rotation"""
    debug_log(f"Fetching tweets for username: {username}, limit: {limit}")
    tweets = []
    path = f"/{username}/rss"
    try:
        entries = fetch_from_nitter(path, limit)
        for entry in entries:
            tweets.append({
                "username": username,
                "display_name": entry.get("author", username),
                "tweet_id": entry.get("id", entry.get("link", "")),
                "text": entry.get("title", ""),
                "timestamp": entry.get("published", ""),
                "images": []  # Nitter RSS does not directly provide images
            })
        debug_log(f"Fetched tweets: {json.dumps(tweets, indent=2)[:1000]}")
        debug_log(f"Successfully fetched {len(tweets)} tweets")
        return tweets
    except Exception as e:
        debug_log(f"Error fetching tweets: {str(e)}")
        return []

def get_tweets_by_hashtag(hashtag, limit=10):
    hashtag = sanitize_hashtag(hashtag)
    debug_log(f"Fetching tweets for hashtag: {hashtag}, limit: {limit}")
    tweets = []
    path = f"/search/rss?f=tweets&q=%23{hashtag}"
    try:
        entries = fetch_from_nitter(path, limit)
        for entry in entries:
            tweets.append({
                "username": entry.get("author", ""),
                "display_name": entry.get("author", ""),
                "tweet_id": entry.get("id", entry.get("link", "")),
                "text": entry.get("title", ""),
                "timestamp": entry.get("published", ""),
                "images": []
            })
        debug_log(f"Successfully fetched {len(tweets)} tweets for hashtag: {hashtag}")
        return tweets
    except Exception as e:
        debug_log(f"Error fetching tweets: {str(e)}")
        return []

def get_random_tweets(limit=10):
    debug_log(f"Fetching random timeline tweets, limit: {limit}")
    hashtags = ['tech', 'news', 'sports', 'entertainment', 'travel', 'AI', 'science', 'politics', 'music', 'movies']
    tweets = []
    import random
    random.shuffle(hashtags)
    try:
        for hashtag in hashtags:
            if len(tweets) >= limit:
                break
            fetched = get_tweets_by_hashtag(hashtag, limit)
            tweets.extend(fetched)
        random.shuffle(tweets)
        tweets = tweets[:limit]
        debug_log(f"Returning {len(tweets)} random timeline tweets.")
        return tweets
    except Exception as e:
        debug_log(f"Error fetching random timeline tweets: {str(e)}")
        return []
