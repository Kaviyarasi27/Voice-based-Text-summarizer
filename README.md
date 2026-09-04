# Voice-based-summarizer
A browser-based text summarization application that combines extractive NLP with speech recognition and text-to-speech to make summarization more interactive and accessible.
## Overview
Voice-Based Text Summarizer allows users to enter text manually or provide text through voice input and generate a concise extractive summary.
The application analyzes sentence-level word frequency and selects the most relevant sentences while preserving their original order.
It also provides speech output for the generated summary using the browser's Text-to-Speech API.
## Features
- 🎙️ Voice-to-text input using Web Speech API
- 📝 Extractive text summarization
- 🔊 Text-to-speech for generated summaries
- 🌐 English, Tamil and Hindi language selection
- 📊 Original and summary word counts
- 📉 Summary reduction percentage
- 🎯 Selectable summary length
- 📱 Responsive browser-based interface
- ⚡ No backend server required for summarization
## How It Works
User Input
    │
    ├── Text Input
    │
    └── Voice Input
            │
            ↓
      Text Processing
            │
            ↓
     Sentence Segmentation
            │
            ↓
        Tokenization
            │
            ↓
      Stop-word Filtering
            │
            ↓
    Word Frequency Analysis
            │
            ↓
      Sentence Scoring
            │
            ↓
     Top Sentence Selection
            │
            ↓
   Original Order Restoration
            │
            ↓
         Summary
            │
       ┌────┴────┐
       ↓         ↓
   Statistics   Text-to-Speech
