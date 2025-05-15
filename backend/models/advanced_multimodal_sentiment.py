import numpy as np
from PIL import Image
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoFeatureExtractor, AutoModelForImageClassification
import logging

class AdvancedMultimodalSentimentAnalyzer:
    def __init__(self):
        logging.info("Initializing AdvancedMultimodalSentimentAnalyzer...")
        # Use a 3-class sentiment model for text
        self.text_model_name = 'cardiffnlp/twitter-roberta-base-sentiment-latest'
        self.tokenizer = AutoTokenizer.from_pretrained(self.text_model_name)
        self.text_model = AutoModelForSequenceClassification.from_pretrained(self.text_model_name)
        self.text_model.eval()

        # Try to use a real image sentiment model, fallback to old method if unavailable
        try:
            self.image_model_name = 'nateraw/vit-base-patch16-224-inat-finetuned-sentiment'
            self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.image_model_name)
            self.image_model = AutoModelForImageClassification.from_pretrained(self.image_model_name)
            self.image_model.eval()
            self.image_sentiment_labels = list(self.image_model.config.id2label.values())
            self.real_image_sentiment = True
            logging.info('Loaded real image sentiment model.')
        except Exception as e:
            logging.warning(f'Could not load real image sentiment model: {e}. Falling back to heuristic.')
            self.image_model_name = 'google/vit-base-patch16-224'
            self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.image_model_name)
            self.image_model = AutoModelForImageClassification.from_pretrained(self.image_model_name)
            self.image_model.eval()
            self.image_sentiment_labels = None
            self.real_image_sentiment = False

        self.sentiment_labels = ['Negative', 'Neutral', 'Positive']
        logging.info("AdvancedMultimodalSentimentAnalyzer initialized successfully.")

    def analyze_text(self, text):
        if not text or not text.strip():
            return np.array([0.333, 0.334, 0.333])
        try:
            # Tokenize input text
            inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            # Get model predictions
            with torch.no_grad():
                outputs = self.text_model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1).numpy()[0]
            # The model outputs [negative, neutral, positive] directly
            return probs
        except Exception as e:
            logging.error(f"Error analyzing text: {e}")
            return np.array([0.333, 0.334, 0.333])

    def analyze_image(self, image):
        if not isinstance(image, Image.Image):
            return np.array([0.333, 0.334, 0.333])
        try:
            inputs = self.feature_extractor(images=image, return_tensors="pt")
            with torch.no_grad():
                outputs = self.image_model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1).numpy()[0]
            if self.real_image_sentiment and self.image_sentiment_labels:
                # Sentiment model: map output to negative/neutral/positive
                # Assume 3-class: negative, neutral, positive
                if len(probs) == 3:
                    return probs
                # If more classes, try to sum appropriately (fallback)
                idx_map = {lbl.lower(): i for i, lbl in enumerate(self.image_sentiment_labels)}
                negative = probs[idx_map.get('negative', 0)] if 'negative' in idx_map else probs[0]
                neutral = probs[idx_map.get('neutral', 1)] if 'neutral' in idx_map else probs[1]
                positive = probs[idx_map.get('positive', 2)] if 'positive' in idx_map else probs[2]
                return np.array([negative, neutral, positive])
            else:
                # Heuristic fallback (ImageNet)
                top_indices = np.argsort(probs)[-5:][::-1]
                top_probs = probs[top_indices]
                positive_keywords = ['happy', 'smile', 'celebration', 'party', 'joy', 'success', 'beauty', 'sun', 'bright']
                negative_keywords = ['sad', 'angry', 'disaster', 'accident', 'damage', 'dark', 'storm', 'war', 'conflict']
                positive_score = 0.0
                negative_score = 0.0
                for idx, prob in zip(top_indices, top_probs):
                    label = self.image_model.config.id2label[idx].lower()
                    if any(kw in label for kw in positive_keywords):
                        positive_score += prob
                    elif any(kw in label for kw in negative_keywords):
                        negative_score += prob
                if positive_score > negative_score * 1.5:
                    return np.array([0.1, 0.3, 0.6])
                elif negative_score > positive_score * 1.5:
                    return np.array([0.6, 0.3, 0.1])
                else:
                    return np.array([0.3, 0.4, 0.3])
        except Exception as e:
            logging.error(f"Error analyzing image: {e}")
            return np.array([0.333, 0.334, 0.333])

    def analyze(self, text=None, image=None):
        logging.debug(f"Analyzing with text: {bool(text)}, image: {bool(image)}")
        text_probs = self.analyze_text(text) if text else None
        image_probs = self.analyze_image(image) if image else None
        text_used = text is not None and text.strip() != ''
        image_used = isinstance(image, Image.Image)
        
        logging.debug(f"Text probs: {text_probs}, Image probs: {image_probs}")
        
        # Weighted late fusion - give more weight to text if available
        if text_probs is not None and image_probs is not None:
            final_probs = 0.7 * text_probs + 0.3 * image_probs
            logging.debug(f"Fusion probs (text 0.7, image 0.3): {final_probs}")
        elif text_probs is not None:
            final_probs = text_probs
        elif image_probs is not None:
            final_probs = image_probs
        else:
            final_probs = np.array([0.333, 0.334, 0.333])
        
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
