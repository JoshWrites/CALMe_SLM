# Debug Guide

This guide covers debugging techniques, common issues, and troubleshooting steps for the AI Therapy Assistant Demo.

## Enabling Debug Mode

### Method 1: URL Parameter
Add `?debug=true` to any page URL:
```
http://localhost:8000/?debug=true
https://yourdomain.github.io/CALMe_SLM/?debug=true
```

### Method 2: Configuration File
Edit `docs/config.js`:
```javascript
CONFIG.debug.enabled = true;
```

### Method 3: Browser Console
```javascript
// Enable at runtime
CONFIG.debug.enabled = true;
window.therapyAssistant.debugConsole.show();
```

## Debug Console Features

### Opening the Console
- Click the "Debug" button in the top-right corner
- Console appears as a resizable panel at bottom-right
- Drag corners to resize the console window

### Console Controls
- **Clear**: Remove all log entries
- **Export**: Download logs as JSON file
- **Close**: Hide the debug console

### Log Levels
- **ERROR**: Critical failures (red background)
- **WARN**: Warnings and potential issues (orange background)
- **INFO**: General information (blue background)
- **VERBOSE**: Detailed debugging information (gray text)

## Interpreting Debug Output

### Application Startup
```
[12:34:56] INFO: Starting AI Therapy Assistant Demo
[12:34:57] VERBOSE: Initializing model loader
[12:34:58] VERBOSE: Initializing audio processor
[12:35:05] INFO: VOSK initialized successfully
[12:35:15] INFO: mT5 model loaded successfully
[12:35:16] INFO: Application initialized successfully
```

### Model Loading Progress
```
[12:34:58] VERBOSE: Loading VOSK model from: ./models/vosk-model-small-en-us-0.15/
[12:35:02] INFO: Loading model from cache
[12:35:05] VERBOSE: Found cached model: 587.34MB
[12:35:15] INFO: Model loaded in 10234ms
```

### Speech Recognition
```
[12:36:12] INFO: Started recording
[12:36:15] VERBOSE: Audio permissions granted - device: Built-in Microphone
[12:36:18] VERBOSE: Speech recognition result: "I'm feeling down today"
[12:36:19] INFO: Stopped recording
```

### Emotion Detection
```
[12:36:19] VERBOSE: Emotion detected: 'sad' - keyword: 'down'
[12:36:19] VERBOSE: Emotion changed from 'listening' to 'sad'
```

### Response Generation
```
[12:36:20] INFO: Sending message: "I'm feeling down today"
[12:36:21] VERBOSE: Input tokenized: 8 tokens
[12:36:23] VERBOSE: Response generated in 142ms
[12:36:23] INFO: Response generated in 2847ms
```

## Performance Metrics

### Understanding the Metrics Bar
```
Uptime: 5m 23s | Memory: 245.7/512.0MB | FPS: 60
```

- **Uptime**: How long the application has been running
- **Memory**: Used/Total JavaScript heap memory
- **FPS**: Current frames per second (animation smoothness)

### Memory Monitoring
- High memory usage (>400MB) may indicate issues
- Memory leaks show as continuously increasing usage
- Refresh the page if memory usage becomes excessive

### Response Time Tracking
- Average response times are calculated automatically
- Warning issued if average exceeds 2 seconds
- Individual response times logged in verbose mode

## Common Error Patterns

### Model Loading Failures

**Error Pattern:**
```
[12:34:58] ERROR: Model loading failed: Failed to fetch
[12:34:58] ERROR: Initialization error: Failed to initialize the application
```

**Causes:**
- Network connectivity issues
- CORS restrictions when loading from file://
- Insufficient browser storage space
- Model file corruption

**Solutions:**
1. Ensure stable internet connection
2. Use a local web server (not file:// protocol)
3. Check available browser storage
4. Clear cache and reload
5. Try incognito mode

### Audio/Microphone Issues

**Error Pattern:**
```
[12:36:10] ERROR: Recording error: NotAllowedError: Permission denied
[12:36:10] ERROR: Unable to access microphone. Please check permissions.
```

**Causes:**
- Microphone permission denied
- No microphone available
- Browser doesn't support Web Audio API
- HTTPS required but using HTTP

**Solutions:**
1. Grant microphone permissions in browser
2. Use HTTPS or localhost
3. Check browser compatibility
4. Test with different microphone

### Memory/Performance Issues

**Warning Pattern:**
```
[12:40:23] WARN: High memory usage detected
[12:40:45] WARN: High average response time: 3247ms
```

**Causes:**
- Insufficient device memory
- Multiple browser tabs consuming resources
- Background applications using CPU/memory
- Large model files

**Solutions:**
1. Close other browser tabs
2. Restart browser
3. Use more powerful device
4. Clear browser cache

## Built-in Test Suite

### Emotion Detection Tests
Enable with `CONFIG.debug.runStartupTests = true`:

```
[12:35:17] INFO: Running startup tests...
[12:35:17] VERBOSE: ✓ Test passed: "I feel great today" → happy
[12:35:17] VERBOSE: ✓ Test passed: "I feel so down" → sad
[12:35:17] VERBOSE: ✓ Test passed: "This is so frustrating" → mad
[12:35:17] VERBOSE: ✗ Test failed: "Can you help me" expected listening, got happy
[12:35:17] WARN: Startup tests completed: 11/12 passed
```

### Manual Testing Commands

**Test Emotion Detection:**
```javascript
// In browser console
window.therapyAssistant.detectEmotion("I'm so happy today!");
window.therapyAssistant.detectEmotion("This is really frustrating");
```

**Test Model Response:**
```javascript
// Generate test response
window.therapyAssistant.modelLoader.generateResponse("Hello").then(response => {
    console.log("Test response:", response);
});
```

**Test Audio Levels:**
```javascript
// Monitor audio levels (when recording)
window.therapyAssistant.audioProcessor.addEventListener('audioLevel', (e) => {
    console.log("Audio level:", e.detail);
});
```

## Browser-Specific Debugging

### Chrome DevTools
1. **Console**: View all console.log outputs
2. **Network**: Monitor model downloads and failures  
3. **Application**: Check localStorage and cache storage
4. **Performance**: Profile CPU and memory usage
5. **Security**: Check HTTPS and permission issues

### Firefox Developer Tools
1. **Console**: Similar to Chrome console
2. **Inspector**: DOM and CSS debugging
3. **Network**: Request monitoring
4. **Storage**: LocalStorage and IndexedDB inspection

### Safari Web Inspector
1. **Console**: JavaScript debugging
2. **Resources**: Check cached files
3. **Timelines**: Performance profiling
4. **Storage**: Local data inspection

## Advanced Debugging Techniques

### Network Request Monitoring
```javascript
// Intercept fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch request:', args[0]);
    return originalFetch.apply(this, args).catch(err => {
        console.error('Fetch failed:', args[0], err);
        throw err;
    });
};
```

### Memory Leak Detection
```javascript
// Monitor memory growth
setInterval(() => {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize / 1024 / 1024;
        console.log(`Memory usage: ${used.toFixed(2)}MB`);
    }
}, 5000);
```

### Model State Inspection
```javascript
// Check model loading state
console.log('Model loaded:', window.therapyAssistant.modelLoader.isLoaded);
console.log('Audio initialized:', window.therapyAssistant.audioProcessor.isInitialized);
console.log('Current emotion:', window.therapyAssistant.currentEmotion);
```

## Debugging Production Issues

### Remote Debugging
For issues that only occur in production:

1. **Enable debug mode** on the live site
2. **Export debug logs** using the Export button
3. **Analyze logs** for error patterns
4. **Reproduce locally** with similar conditions

### User-Reported Issues
When users report problems:

1. **Collect information**:
   - Browser version and OS
   - Error messages or symptoms
   - Steps to reproduce
   - Debug logs if possible

2. **Isolate the issue**:
   - Test in multiple browsers
   - Try incognito mode
   - Test with different network conditions
   - Check mobile vs desktop

3. **Provide workarounds**:
   - Clear cache instructions
   - Alternative browsers
   - Offline version download

## Creating Debug Reports

### Automated Report Generation
The Export button creates comprehensive debug reports including:

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "logs": [...],
  "performance": {
    "startTime": 1704110400000,
    "modelLoadTime": 10234,
    "averageResponseTime": [1200, 1150, 1300],
    "memorySnapshots": [...]
  },
  "config": {...},
  "userAgent": "Mozilla/5.0...",
  "platform": "MacIntel",
  "memory": {
    "used": 245760000,
    "total": 512000000,
    "limit": 2147483648
  }
}
```

### Manual Report Creation
For systematic debugging:

1. **Record issue details**:
   - Time and date
   - Specific actions taken
   - Expected vs actual behavior
   - Browser and system information

2. **Capture debug output**:
   - Enable verbose logging
   - Export logs after reproducing issue
   - Take screenshots if UI issues

3. **Document solution**:
   - Steps taken to resolve
   - Configuration changes made
   - Prevention measures

## Best Practices

### Development Debugging
- Always test with debug mode enabled
- Monitor console for warnings during development
- Use verbose logging for complex operations
- Test across multiple browsers regularly

### Production Monitoring
- Include debug toggle for production issues
- Monitor performance metrics regularly
- Keep debug logs for issue investigation
- Provide clear user-facing error messages

### Performance Optimization
- Use performance metrics to identify bottlenecks
- Monitor memory usage during long sessions
- Profile model loading and response times
- Test on various device capabilities

### User Support
- Create debugging instructions for users
- Provide multiple fallback options
- Document common issues and solutions
- Make debug features accessible but not intrusive

## Troubleshooting Checklist

When encountering issues, systematically check:

- [ ] Debug mode is enabled and console is visible
- [ ] Browser console shows no critical errors
- [ ] Network requests are completing successfully
- [ ] Model files are loading correctly
- [ ] Audio permissions are granted (if using voice)
- [ ] Sufficient memory and storage available
- [ ] HTTPS is being used (not HTTP)
- [ ] Browser is supported and up-to-date
- [ ] Cache is cleared if configuration changed
- [ ] All required files are present and accessible

Remember: The debug console is your primary tool for understanding what's happening in the application. When in doubt, enable verbose logging and follow the message flow to identify where issues occur.