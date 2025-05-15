# Multimodal Sentiment Analysis

This project implements a multimodal sentiment analysis framework that combines visual and textual features to classify content sentiment as positive, neutral, or negative.

## Architecture

- **Backend**: 
  - Vision Transformer (ViT-L16) for image analysis
  - BERT for text analysis
  - Late fusion with averaging-based sentiment classification

- **Frontend**:
  - Twitter-like interface for browsing posts
  - Nitter integration for fetching tweet data
  - Dynamic visualization of sentiment analysis results

## Setup and Installation

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```
   python backend/app.py
   ```
4. Start the frontend (in a new terminal):
   ```
   cd frontend
   npm install
   npm start
   ```

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Use the search functionality to find tweets by username or hashtag
3. Select a tweet to analyze its sentiment
4. View the sentiment analysis results in the visualization panel

## Project Structure

- `backend/`: Contains the Flask API server and ML models
- `frontend/`: Contains the React-based user interface
- `models/`: Pre-trained model weights and configuration
- `utils/`: Helper functions and utilities

## License

This project is for academic purposes only.
