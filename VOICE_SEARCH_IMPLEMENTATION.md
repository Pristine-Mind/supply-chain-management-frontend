# Voice Search Implementation Guide

This document outlines the implementation of the client-side voice search feature in the Supply Chain Management frontend.

## Overview

The voice search feature allows users to search for products using voice commands. It leverages the browser's native **Web Speech API** to convert speech to text in real-time, providing a seamless and "free" solution without requiring third-party audio processing services on the backend.

## Technical Approach

We utilize the `SpeechRecognition` interface (prefixed as `webkitSpeechRecognition` in some browsers). This API processes audio input directly in the browser and returns text transcripts.

### Key Features

1.  **Client-Side Processing:** No audio files are sent to the server. Text is generated locally and sent to existing search endpoints.
2.  **Real-Time Transcription:** Users see what they are saying appear in the search box instantly (interim results).
3.  **Visual Feedback:**
    *   **"Listening..." Indicator:** The search bar border turns red and glows.
    *   **Animations:** The microphone icon pulses, and the search icon bounces while recording.
    *   **Focus:** The search input scales up slightly to draw attention.
4.  **Auto-Submission:** The search is automatically triggered once the user stops speaking and the final result is confirmed.

## Components Modified

The voice search functionality has been integrated into the following components:

### 1. `src/components/ProductSearchBar.tsx`
*   **Location:** The main navigation bar search.
*   **Behavior:** Updates the local query state and shows search suggestions as the user speaks.

### 2. `src/components/Marketplace.tsx`
*   **Location:** The large search bar on the Marketplace landing page.
*   **Behavior:** Navigates the user to the `/marketplace/all-products` page with the transcribed text as the search query.

### 3. `src/components/MarketplaceAllProducts.tsx`
*   **Location:** The search bar on the product listing page (both desktop and mobile modal).
*   **Behavior:** Updates the search term and triggers the debounced search logic immediately upon receiving the final transcript.

## Implementation Details

### Core Logic Hook

The core logic follows this pattern across components:

```typescript
const startVoiceSearch = () => {
  // 1. Check Browser Support
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Voice search is not supported in your browser');
    return;
  }

  // 2. Initialize API
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // 3. Configure Settings
  recognition.continuous = false;      // Stop after one sentence
  recognition.interimResults = true;   // Show text while speaking
  recognition.lang = 'en-US';          // Language

  setIsListening(true);
  setQuery(''); // Clear previous text

  // 4. Handle Results
  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    // Update UI with interim or final text
    if (finalTranscript) {
      setQuery(finalTranscript);
      setIsListening(false);
      handleSearch(finalTranscript); // Trigger search
    } else {
      setQuery(interimTranscript);
    }
  };

  // 5. Handle Errors/End
  recognition.onerror = () => setIsListening(false);
  recognition.onend = () => setIsListening(false);

  recognition.start();
};
```

### UI Styling (Tailwind CSS)

We use dynamic classes to provide visual feedback based on the `isListening` state:

```tsx
<div className={`relative transition-all duration-300 ${isListening ? 'scale-[1.02]' : ''}`}>
  <input
    className={`transition-all ${isListening ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-300'}`}
    placeholder={isListening ? "Listening..." : "Search..."}
    // ...
  />
  <Mic className={`${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
</div>
```

## Browser Support

This feature relies on the **Web Speech API**.
*   **Supported:** Google Chrome, Microsoft Edge, Safari, Opera, Android Webview, Samsung Internet.
*   **Not Supported:** Firefox (requires configuration), Internet Explorer.

The code includes a check `if (!('webkitSpeechRecognition' in window) ...)` to gracefully alert users on unsupported browsers.
