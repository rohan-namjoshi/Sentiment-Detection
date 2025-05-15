import praw

def get_reddit_client():
    # HARDCODE your reddit script credentials here for quick testing ONLY
    client_id = 'JrKw8T8KjXj4e-IzO3YfqA'
    client_secret = 'cNPDC4b4QTuxCw4jjeK9udNfE6kKcQ'
    user_agent = 'sentimentdetection/1.0 by SentimentDetection'
    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent
    )
