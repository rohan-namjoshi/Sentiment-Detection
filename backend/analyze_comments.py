from flask import Blueprint, request, jsonify
from models.sentiment_model import MultimodalSentimentAnalyzer
analyzer = MultimodalSentimentAnalyzer()

analyze_comments_bp = Blueprint('analyze_comments', __name__)

@analyze_comments_bp.route('/api/analyze/comments', methods=['POST'])
def analyze_comments():
    comments = request.json.get('comments', [])
    if not comments or not isinstance(comments, list):
        return jsonify({'error': 'No comments provided'}), 400

    results = [analyzer.analyze(text=comment, image=None) for comment in comments]
    # Aggregate: majority sentiment and average distribution
    sentiments = [r['sentiment'] for r in results if 'sentiment' in r]
    distribution_sum = {'Negative': 0, 'Neutral': 0, 'Positive': 0}
    count = 0
    for r in results:
        if 'distribution' in r:
            for k in distribution_sum:
                distribution_sum[k] += r['distribution'].get(k, 0)
            count += 1
    avg_distribution = {k: (distribution_sum[k] / count if count else 0) for k in distribution_sum}
    # Majority sentiment
    from collections import Counter
    sentiment_majority = Counter(sentiments).most_common(1)[0][0] if sentiments else 'Neutral'
    return jsonify({
        'results': results,
        'avg_distribution': avg_distribution,
        'majority_sentiment': sentiment_majority,
        'count': count
    })
