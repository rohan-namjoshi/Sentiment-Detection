from .reddit_hardcoded_client import get_reddit_client

def get_posts_from_subreddit(subreddit_name, limit=10):
    reddit = get_reddit_client()
    subreddit = reddit.subreddit(subreddit_name)
    posts = []
    for submission in subreddit.hot(limit=limit):
        # Skip posts with no title and no selftext
        if not submission.title and not submission.selftext:
            continue
        author = str(submission.author) if submission.author else '[deleted]'
        # Reddit avatar API (fallback to placeholder)
        profile_pic_url = f'https://www.redditstatic.com/avatars/avatar_default_02_24A0ED.png'  # Default Reddit avatar
        try:
            if hasattr(submission.author, 'icon_img') and submission.author.icon_img:
                profile_pic_url = submission.author.icon_img
        except Exception:
            pass
        # Extract images
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
        posts.append({
            'post_id': submission.id,
            'title': submission.title,
            'text': submission.selftext,
            'url': submission.url,
            'images': images,
            'num_comments': submission.num_comments,
            'author': author,
            'profile_pic_url': profile_pic_url,
            'subreddit': str(submission.subreddit),
            'timestamp': int(submission.created_utc)
        })
    return posts

def get_post_and_comments(post_url):
    reddit = get_reddit_client()
    submission = reddit.submission(url=post_url)
    # Extract images
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
        'author': str(submission.author) if submission.author else '[deleted]',
        'subreddit': str(submission.subreddit),
        'timestamp': int(submission.created_utc)
    }
    submission.comments.replace_more(limit=0)
    comments = []
    for comment in submission.comments.list():
        comments.append({
            'comment_id': comment.id,
            'text': comment.body,
            'author': str(comment.author) if comment.author else '[deleted]',
            'images': []  # Reddit comments rarely have images
        })
    return post, comments
