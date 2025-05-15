import numpy as np
from PIL import Image
import re

class SimpleMultimodalSentimentAnalyzer:
    def __init__(self):
        self.positive_words = set([
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'joy', 'awesome', 'best', 'success', 'win', 'positive', 'beautiful', 'enjoy', 'impressive', 'inspiring', 'celebrate', 'progress', 'improved', 'helpful', 'favorite', 'congratulations', 'proud', 'thank', 'grateful', 'appreciate', 'achievement', 'perfect', 'outstanding', 'brilliant'
        ])
        self.negative_words = set([
            'bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing', 'hate', 'dislike', 'sad', 'angry', 'upset', 'unfortunate', 'worst', 'failure', 'fail', 'problem', 'issue', 'trouble', 'hard', 'negative', 'wrong', 'error', 'broken', 'useless', 'waste', 'sorry', 'complaint', 'annoying', 'frustrating', 'unhappy', 'regret', 'disaster', 'critical', 'worried', 'concerned', 'pathetic', 'ridiculous', 'inadequate', 'uncomfortable'
        ])
        self.sentiment_labels = ['Negative', 'Neutral', 'Positive']

    def analyze_text(self, text):
        if not text:
            return np.array([0.333, 0.334, 0.333])
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        words = text.split()
        pos = sum(1 for w in words if w in self.positive_words)
        neg = sum(1 for w in words if w in self.negative_words)
        if pos > neg:
            return np.array([0.1, 0.2, 0.7])  # Positive
        elif neg > pos:
            return np.array([0.7, 0.2, 0.1])  # Negative
        else:
            return np.array([0.25, 0.5, 0.25])  # Neutral

    def analyze_image(self, image):
        if not isinstance(image, Image.Image):
            return np.array([0.333, 0.334, 0.333])
        # Simple heuristic: brightness
        img = image.convert('L').resize((32, 32))
        arr = np.array(img) / 255.0
        brightness = arr.mean()
        if brightness > 0.65:
            return np.array([0.1, 0.2, 0.7])  # Positive
        elif brightness < 0.35:
            return np.array([0.7, 0.2, 0.1])  # Negative
        else:
            return np.array([0.25, 0.5, 0.25])  # Neutral

    def analyze(self, text=None, image=None):
        import logging
        logging.basicConfig(level=logging.DEBUG)
        text_probs = self.analyze_text(text) if text else None
        image_probs = self.analyze_image(image) if image else None
        text_used = text is not None and text.strip() != ''
        # Debug: log image type and info
        logging.debug(f"[Multimodal] image type: {type(image)}")
        if isinstance(image, Image.Image):
            logging.debug(f"[Multimodal] image mode: {image.mode}, size: {image.size}")
        image_used = isinstance(image, Image.Image)
        # Late fusion
        if text_probs is not None and image_probs is not None:
            final_probs = (text_probs + image_probs) / 2
        elif text_probs is not None:
            final_probs = text_probs
        elif image_probs is not None:
            final_probs = image_probs
        else:
            final_probs = np.array([0.333, 0.334, 0.333])  # Balanced when no input
        sentiment_idx = int(np.argmax(final_probs))
        sentiment = self.sentiment_labels[sentiment_idx]
        sentiment_distribution = {self.sentiment_labels[i]: float(final_probs[i]) for i in range(3)}
        return {
            'sentiment': sentiment,
            'confidence': float(final_probs[sentiment_idx]),
            'distribution': sentiment_distribution,
            'text_used': text_used,
            'image_used': image_used
        }
