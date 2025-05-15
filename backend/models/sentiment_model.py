import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import BertTokenizer, BertModel, ViTFeatureExtractor, ViTModel
from PIL import Image
import numpy as np
import re

class TextSentimentModel(nn.Module):
    def __init__(self):
        super(TextSentimentModel, self).__init__()
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        self.dropout = nn.Dropout(0.1)
        self.fc = nn.Linear(768, 3)  # 3 sentiment classes: positive, neutral, negative
        
    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        x = self.dropout(pooled_output)
        logits = self.fc(x)
        return logits

class ImageSentimentModel(nn.Module):
    def __init__(self):
        super(ImageSentimentModel, self).__init__()
        self.vit = ViTModel.from_pretrained('google/vit-large-patch16-224')
        self.dropout = nn.Dropout(0.1)
        # ViT-L/16 has an embedding dimension of 1024
        self.fc1 = nn.Linear(1024, 512)
        self.fc2 = nn.Linear(512, 3)  # 3 sentiment classes
        self.gelu = nn.GELU()
        
    def forward(self, pixel_values):
        outputs = self.vit(pixel_values=pixel_values)
        pooled_output = outputs.pooler_output
        x = self.dropout(pooled_output)
        x = self.gelu(self.fc1(x))
        logits = self.fc2(x)
        return logits

class MultimodalSentimentAnalyzer:
    def __init__(self):
        # Initialize text components
        self.text_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
        self.text_model = TextSentimentModel()
        
        # Initialize image components
        self.image_processor = ViTFeatureExtractor.from_pretrained('google/vit-large-patch16-224')
        self.image_model = ImageSentimentModel()
        
        # Load models if available
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        try:
            self.text_model.load_state_dict(torch.load('models/text_sentiment_model.pth', map_location=self.device))
            self.image_model.load_state_dict(torch.load('models/image_sentiment_model.pth', map_location=self.device))
        except:
            print("Warning: Pre-trained models not found. Using content-based sentiment analysis.")
        
        self.text_model.to(self.device)
        self.image_model.to(self.device)
        self.text_model.eval()
        self.image_model.eval()
        
        self.sentiment_labels = ['Negative', 'Neutral', 'Positive']
        
        # Sentiment lexicons
        self.positive_words = set([
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'terrific', 'outstanding',
            'brilliant', 'love', 'happy', 'joy', 'excited', 'awesome', 'beautiful', 'best', 'perfect',
            'recommend', 'impressive', 'favorite', 'success', 'successful', 'win', 'winning', 'winner',
            'congratulations', 'congrats', 'positive', 'achievement', 'achieve', 'accomplished', 'proud',
            'interesting', 'thank', 'thanks', 'grateful', 'appreciate', 'impressed', 'remarkable',
            'easy', 'inspiring', 'inspired', 'celebrate', 'celebration', 'progress', 'improved',
            'improvement', 'beneficial', 'helpful', 'enjoy', 'enjoyed', 'enjoying', 'impressive'
        ])
        
        self.negative_words = set([
            'bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing', 'disappointed', 'hate',
            'dislike', 'sad', 'angry', 'mad', 'upset', 'unfortunate', 'unwanted', 'worst', 'failure',
            'fail', 'failed', 'failing', 'problem', 'issue', 'trouble', 'difficult', 'hard', 'negative',
            'wrong', 'error', 'mistake', 'flawed', 'broken', 'damage', 'damaged', 'useless', 'waste',
            'sorry', 'apology', 'apologize', 'complaint', 'complain', 'annoying', 'annoyed', 'frustrating',
            'frustrated', 'frustration', 'unhappy', 'unhappiness', 'regret', 'regretful', 'disaster',
            'catastrophe', 'tragic', 'tragedy', 'critical', 'criticism', 'worried', 'worry', 'concern',
            'concerned', 'pathetic', 'ridiculous', 'inadequate', 'inferior', 'uncomfortable'
        ])
        
        # Negation words that flip sentiment
        self.negation_words = set([
            'not', 'no', 'never', 'none', 'neither', 'nor', 'nothing', 'nowhere', 'nobody', 'hardly',
            'barely', 'scarcely', 'doesn\'t', 'don\'t', 'didn\'t', 'won\'t', 'wouldn\'t', 'can\'t',
            'cannot', 'couldn\'t', 'shouldn\'t', 'hasn\'t', 'haven\'t', 'hadn\'t', 'isn\'t', 'aren\'t',
            'wasn\'t', 'weren\'t'
        ])
        
        # Emoji sentiment
        self.positive_emojis = set(['😀', '😃', '😄', '😁', '😆', '😊', '😎', '😍', '🥰', '😘', '❤️', 
                                  '💯', '👍', '👏', '🙌', '🔥', '✅', '💪', '🎉', '🎊', '🥳'])
        self.negative_emojis = set(['😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '😢', 
                                  '😭', '😠', '😡', '🤬', '👎', '❌', '💔', '⛔', '🚫', '😱'])
        
    def analyze(self, text, image=None):
        # Try to use trained models if available
        try:
            return self.analyze_with_models(text, image)
        except:
            # Fall back to content-based analysis
            return self.analyze_content_based(text, image)
    
    def analyze_with_models(self, text, image=None):
        # Process text input
        text_probs = None
        if text:
            inputs = self.text_tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                text_outputs = self.text_model(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'])
                text_probs = F.softmax(text_outputs, dim=1).cpu().numpy()[0]
        
        # Process image input
        image_probs = None
        if image:
            inputs = self.image_processor(images=image, return_tensors='pt')
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                image_outputs = self.image_model(pixel_values=inputs['pixel_values'])
                image_probs = F.softmax(image_outputs, dim=1).cpu().numpy()[0]
        
        # Late fusion - average probabilities if both modalities are present
        if text_probs is not None and image_probs is not None:
            # Average the probabilities for late fusion
            final_probs = (text_probs + image_probs) / 2
        elif text_probs is not None:
            final_probs = text_probs
        elif image_probs is not None:
            final_probs = image_probs
        else:
            return {"error": "No input provided"}
        
        # Get the sentiment with highest probability
        sentiment_idx = np.argmax(final_probs)
        sentiment = self.sentiment_labels[sentiment_idx]
        
        # Format the probability distribution
        sentiment_distribution = {
            self.sentiment_labels[i]: float(final_probs[i]) for i in range(len(self.sentiment_labels))
        }
        
        return {
            "sentiment": sentiment,
            "confidence": float(final_probs[sentiment_idx]),
            "distribution": sentiment_distribution,
            "text_used": text is not None,
            "image_used": image is not None
        }
    
    def analyze_content_based(self, text, image=None):
        """Analyze sentiment based on text content and keywords"""
        text_score = 0
        confidence = 0.7  # Base confidence
        
        if text:
            # Clean and normalize text
            text = text.lower()
            text = re.sub(r'[^\w\s\']', ' ', text)  # Keep apostrophes for contractions
            words = text.split()
            
            # Count negation words
            negation_count = sum(1 for word in words if word in self.negation_words)
            has_negation = negation_count % 2 == 1  # Odd number of negations flips sentiment
            
            # Count sentiment words
            positive_count = sum(1 for word in words if word in self.positive_words)
            negative_count = sum(1 for word in words if word in self.negative_words)
            
            # Check for emojis
            positive_emoji_count = sum(1 for char in text if char in self.positive_emojis)
            negative_emoji_count = sum(1 for char in text if char in self.negative_emojis)
            
            # Calculate the sentiment score
            positive_score = positive_count + positive_emoji_count
            negative_score = negative_count + negative_emoji_count
            
            if has_negation:
                # Flip the dominant sentiment
                if positive_score > negative_score:
                    text_score = -1 * (positive_score - negative_score)
                else:
                    text_score = (negative_score - positive_score)
            else:
                text_score = positive_score - negative_score
            
            # Normalize score to range [-1, 1]
            total_counts = max(1, positive_count + negative_count + positive_emoji_count + negative_emoji_count)
            text_score = text_score / total_counts
            
            # Higher confidence with more sentiment words
            if total_counts > 3:
                confidence = min(0.95, 0.7 + (total_counts - 3) * 0.05)
        
        # Determine sentiment
        if text_score > 0.1:
            sentiment = "Positive"
            final_score = text_score
        elif text_score < -0.1:
            sentiment = "Negative"
            final_score = abs(text_score)
        else:
            sentiment = "Neutral"
            final_score = 0.5 - abs(text_score)
            
        # Create probability distribution
        if sentiment == "Positive":
            distribution = {
                "Negative": max(0, min(1, 0.1 - text_score * 0.05)),
                "Neutral": max(0, min(1, 0.3 - text_score * 0.1)),
                "Positive": max(0, min(1, 0.6 + text_score * 0.4))
            }
        elif sentiment == "Negative":
            distribution = {
                "Negative": max(0, min(1, 0.6 + abs(text_score) * 0.4)),
                "Neutral": max(0, min(1, 0.3 - abs(text_score) * 0.1)),
                "Positive": max(0, min(1, 0.1 - abs(text_score) * 0.05))
            }
        else:
            distribution = {
                "Negative": max(0, min(1, 0.2 + abs(text_score) * 0.2)),
                "Neutral": max(0, min(1, 0.6 - abs(text_score) * 0.2)),
                "Positive": max(0, min(1, 0.2 + text_score * 0.2))
            }
            
        # Normalize distribution to sum to 1
        total = sum(distribution.values())
        distribution = {k: v/total for k, v in distribution.items()}
        
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "distribution": distribution,
            "text_used": text is not None,
            "image_used": image is not None
        }
