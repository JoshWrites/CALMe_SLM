# AI Therapy Assistant Demo - Quant v0.0.3

A web-based demonstration of an AI therapy assistant with speech recognition, emotional state detection, and offline capabilities.

## Project Overview

This project demonstrates a therapy assistant interface that can:
- Accept text and voice input
- Provide supportive responses using quantized mT5 language models (INT8)
- Run efficiently in browsers with reduced memory footprint (~430MB total)
- Detect and display emotional states through visual feedback
- Operate completely offline after initial setup
- Provide debugging and development tools

**Quant v0.0.3 Features:**
- **75% memory reduction** compared to previous versions
- **Quantized INT8 models** for faster loading and inference
- **Streamlined architecture** with no fallback modes
- **Mobile browser compatible** (~550MB total PWA memory usage)

**Created by the CALMe Team for educational and demonstration purposes.**

## License and Usage

© 2025 CALMe Team - All rights reserved.

This software is provided for **educational, evaluation, and non-commercial use only**. It is intended as a demonstration project for the AI Therapy Assistant Demo created during a hackathon.

**You may:**
- View, use, and modify the code for personal or team development
- Share the project for educational or demo purposes with attribution

**You may NOT:**
- Use this software for commercial purposes
- Redistribute without explicit written permission
- Remove or alter the license notice

See the [LICENSE](LICENSE) file for complete terms.

## Quick Start

### Try the Web Demo

1. Visit the GitHub Pages demo (once hosted)
2. Allow microphone access when prompted
3. Wait for models to load (first time may take 2-3 minutes)
4. Start chatting via text or voice

### Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/JoshWrites/CALMe_SLM.git
   cd CALMe_SLM
   ```

2. Serve the `docs/` folder using a local web server:
   ```bash
   # Python 3
   python -m http.server 8000 --directory docs
   
   # Or using Node.js
   npx serve docs
   ```

3. Open http://localhost:8000 in your browser

## Download and Install

For offline use without internet dependency:

1. Download the [offline package](docs/download/download.html)
2. Extract the ZIP file
3. Open `index.html` in your browser
4. No web server required for offline version

## System Requirements

**Minimum Requirements:**
- Modern web browser (Chrome 88+, Firefox 78+, Safari 14+, Edge 88+)
- 4GB RAM (8GB recommended)
- 200MB free storage space
- Microphone for voice features (optional)

**Recommended for Best Experience:**
- Chrome or Edge browser
- 8GB+ RAM
- SSD storage
- Stable internet connection for initial model download

## Features

### Core Functionality
- **Text Input**: Type messages using the text input field
- **Voice Input**: Click microphone button for speech-to-text
- **AI Responses**: Contextual therapy-style responses using mT5 model
- **Conversation History**: Persistent chat history during session
- **Privacy**: All processing happens locally after model download

### Emotional State Detection
- **Visual Feedback**: Emoji-style faces showing detected emotions
- **Real-time Updates**: Instant switching based on conversation tone
- **Four States**: Happy, Listening, Sad, Mad
- **Keyword-based**: Simple but effective emotion detection

### Speech Recognition
- **Offline Processing**: Uses VOSK WebAssembly for local speech recognition
- **Multiple Modes**: Push-to-talk or toggle recording modes
- **Audio Visualization**: Real-time audio level display
- **Auto-stop**: Configurable silence detection
- **Mobile Support**: Optimized for mobile browsers

### Debug Features
- **Debug Console**: Real-time logging and performance metrics
- **Testing Suite**: Built-in emotion detection tests
- **Performance Monitoring**: Memory usage, response times
- **Export Logs**: Download debug information for analysis

## GitHub Pages Hosting

To host your own copy:

1. Fork this repository
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch"
4. Select `main` branch and `/docs` folder
5. Your demo will be available at `https://yourusername.github.io/CALMe_SLM`

## Model Swapping Guide

The demo is designed for easy model replacement:

### Default Setup
- **mT5-small**: Downloaded from Hugging Face Hub (~600MB)
- **VOSK English**: Included in repository (~45MB)

### Swapping the Language Model

1. **Prepare your model**: Convert to ONNX format if needed
2. **Update config**: Modify `docs/config.js`:
   ```javascript
   CONFIG.models.mt5.source = "local";
   CONFIG.models.mt5.local_path = "./models/your-model.onnx";
   ```
3. **Place model file**: Copy to `docs/models/`
4. **Clear cache**: Use browser dev tools or incognito mode
5. **Test**: Reload and verify functionality

See [SWAP-MODEL-INSTRUCTIONS.md](SWAP-MODEL-INSTRUCTIONS.md) for detailed steps.

## Troubleshooting

### Common Issues

**Models won't load:**
- Check internet connection for initial download
- Clear browser cache and reload
- Try incognito/private browsing mode
- Ensure sufficient free storage space

**Microphone not working:**
- Grant microphone permissions in browser
- Check browser compatibility (Chrome/Edge recommended)
- Test with different microphone if available
- Ensure HTTPS or localhost (required for microphone access)

**Performance issues:**
- Close other browser tabs/applications
- Use Chrome or Edge for best performance
- Ensure sufficient RAM available
- Try the debug console for performance metrics

**Emotional states not changing:**
- Use clear emotional language in messages
- Check the debug console for emotion detection logs
- Try the test phrases in debug mode

### Getting Help

1. Enable debug mode: Add `?debug=true` to URL
2. Check the debug console for error messages
3. Export debug logs for analysis
4. Review the [DEBUG-GUIDE.md](DEBUG-GUIDE.md)

## Privacy and Security

### Data Handling
- **No external servers**: All processing happens in your browser
- **Local storage only**: Conversations stored locally, not transmitted
- **Model caching**: Downloaded models cached for performance
- **No telemetry**: No usage data sent to external services

### Security Features
- **Offline operation**: Works without internet after setup
- **Local processing**: AI inference runs entirely in browser
- **No API keys**: No external API dependencies
- **Open source**: All code available for review

## Development

### Project Structure
```
CALMe_SLM/
├── docs/                          # GitHub Pages source
│   ├── index.html                 # Main application
│   ├── styles.css                 # UI styling
│   ├── script.js                  # Main application logic
│   ├── config.js                  # Configuration
│   ├── model-loader.js            # AI model management
│   ├── audio-processor.js         # Speech recognition
│   ├── debug-console.js           # Debug features
│   ├── lib/                       # External libraries
│   ├── models/                    # Model files (cached)
│   ├── images/                    # Emotional state images
│   └── download/                  # Offline package
├── scripts/                       # Build and utility scripts
├── LICENSE                        # License terms
└── README.md                      # This file
```

### Extending the Demo

**Adding new emotions:**
1. Create new SVG image in `docs/images/`
2. Add keywords to emotion detection in `script.js`
3. Update CSS if needed for new states

**Modifying responses:**
1. Update the response generation in `model-loader.js`
2. Add new response patterns or improve existing ones
3. Test with various input types

**Adding features:**
1. Follow existing code patterns and conventions
2. Add appropriate debug logging
3. Update configuration in `config.js`
4. Test thoroughly across browsers

## Debug Mode

Enable detailed logging and performance monitoring:

1. **URL parameter**: Add `?debug=true` to any page URL
2. **Console toggle**: Click the Debug button in the header
3. **Features available**:
   - Real-time performance metrics
   - Detailed logging with timestamps
   - Memory usage monitoring
   - Built-in test suite
   - Log export functionality

See [DEBUG-GUIDE.md](DEBUG-GUIDE.md) for comprehensive debugging information.

## Testing

### Built-in Tests
- **Emotion detection**: Tests all four emotional states
- **Model loading**: Validates model initialization
- **Audio pipeline**: Tests speech recognition components
- **Performance**: Memory and timing validation

### Manual Testing Checklist
- [ ] Application loads without errors
- [ ] Models download and initialize successfully
- [ ] Text input and responses work
- [ ] Voice input records and transcribes
- [ ] Emotional states change appropriately
- [ ] Debug console shows relevant information
- [ ] Settings modal opens and saves preferences
- [ ] Conversation can be cleared and copied

## Attribution

**Created by CALMe Team**
- Original concept and implementation
- UI/UX design and development
- Model integration and optimization
- Documentation and testing

**Technologies Used:**
- [VOSK](https://alphacephei.com/vosk/) for speech recognition
- [ONNX.js](https://onnxjs.ai/) for model inference
- [mT5](https://huggingface.co/google/mt5-small) for language generation
- Pure HTML5, CSS3, and JavaScript

For questions, licensing inquiries, or commercial use, contact the CALMe Team.

---

*This project was created as a demonstration of AI therapy assistant capabilities. It is not intended to replace professional mental health services and should not be used for actual therapy or medical advice.*