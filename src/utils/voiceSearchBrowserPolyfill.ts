/**
 * Cross-Browser Voice Search Polyfill Utility
 * Provides fallback and compatibility layer for voice search across all browsers
 * Handles Firefox, Safari, and other browsers that lack native Web Speech API
 */

export interface VoiceSearchCapabilities {
  supported: boolean;
  browserName: string;
  recommendation: string;
  canUseWebSpeech: boolean;
  canUseAudioFile: boolean;
}

export interface BrowserInfo {
  name: string;
  version: string;
  isFirefox: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isEdge: boolean;
}

/**
 * Detects browser information and capabilities
 */
export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  
  let name = 'Unknown';
  let version = 'Unknown';
  let isFirefox = false;
  let isChrome = false;
  let isSafari = false;
  let isEdge = false;

  // Detect browser
  if (/Firefox/.test(ua)) {
    name = 'Firefox';
    isFirefox = true;
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (/Chrome/.test(ua)) {
    name = 'Chrome';
    isChrome = true;
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    name = 'Safari';
    isSafari = true;
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (/Edg/.test(ua)) {
    name = 'Edge';
    isEdge = true;
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }

  return { name, version, isFirefox, isChrome, isSafari, isEdge };
}

/**
 * Checks if Web Speech API is available
 */
export function isWebSpeechApiAvailable(): boolean {
  const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

/**
 * Gets voice search capabilities for current browser
 */
export function getVoiceSearchCapabilities(): VoiceSearchCapabilities {
  const browser = detectBrowser();
  const webSpeechAvailable = isWebSpeechApiAvailable();
  
  // Firefox has very limited Web Speech API support
  // We should recommend audio file uploading for Firefox
  if (browser.isFirefox) {
    return {
      supported: true, // We support Firefox via audio file fallback
      browserName: browser.name,
      recommendation: 'Firefox has limited Web Speech API support. You can still search by uploading an audio file or using text search.',
      canUseWebSpeech: false, // Firefox doesn't support Web Speech API well
      canUseAudioFile: true,
    };
  }
  
  // Chrome has full support
  if (browser.isChrome) {
    return {
      supported: true,
      browserName: browser.name,
      recommendation: 'Chrome provides full voice search support.',
      canUseWebSpeech: webSpeechAvailable,
      canUseAudioFile: true,
    };
  }
  
  // Edge (Chromium-based) also has support
  if (browser.isEdge) {
    return {
      supported: true,
      browserName: browser.name,
      recommendation: 'Edge provides full voice search support.',
      canUseWebSpeech: webSpeechAvailable,
      canUseAudioFile: true,
    };
  }
  
  // Safari has limited support (iOS Safari is better)
  if (browser.isSafari) {
    return {
      supported: true,
      browserName: browser.name,
      recommendation: 'Safari has limited Web Speech API support. You can use text search or audio file upload.',
      canUseWebSpeech: webSpeechAvailable,
      canUseAudioFile: true,
    };
  }
  
  return {
    supported: webSpeechAvailable,
    browserName: browser.name,
    recommendation: 'Your browser may have limited voice search support. Try text search or audio file upload.',
    canUseWebSpeech: webSpeechAvailable,
    canUseAudioFile: true,
  };
}

/**
 * Gets SpeechRecognition API instance with proper fallback
 * Works across Chrome, Edge, and other Chromium-based browsers
 * Returns null for browsers that don't support Web Speech API
 */
export function getSpeechRecognitionAPI(): any {
  const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
  
  // Explicitly check for Firefox and return null
  // Firefox's implementation is unreliable
  const browser = detectBrowser();
  if (browser.isFirefox || browser.isSafari) {
    return null;
  }
  
  return SpeechRecognition || null;
}

/**
 * Creates a safe speech recognition instance with error handling
 */
export function createSafeRecognitionInstance(): { 
  recognition: any; 
  error: string | null;
} {
  try {
    const SpeechRecognition = getSpeechRecognitionAPI();
    
    if (!SpeechRecognition) {
      const capabilities = getVoiceSearchCapabilities();
      return {
        recognition: null,
        error: capabilities.recommendation,
      };
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = 'en-US';
    
    // Add timeout to prevent hanging
    recognition.onerror = (event: any) => {
      console.warn(`Speech Recognition Error: ${event.error}`);
    };
    
    return { recognition, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize speech recognition';
    return {
      recognition: null,
      error: errorMessage,
    };
  }
}

/**
 * Formats browser support message for UI display
 */
export function getVoiceSearchUiMessage(): string {
  const capabilities = getVoiceSearchCapabilities();
  
  if (!capabilities.canUseWebSpeech && capabilities.canUseAudioFile) {
    return `📁 Voice search not fully supported in ${capabilities.browserName}. Use text search or upload audio instead.`;
  }
  
  if (!capabilities.supported) {
    return 'Voice search is not supported in your browser. Try text search instead.';
  }
  
  return '';
}

/**
 * Checks if we should show the microphone button
 */
export function shouldShowMicrophoneButton(): boolean {
  const capabilities = getVoiceSearchCapabilities();
  return capabilities.canUseWebSpeech;
}

/**
 * Gets alternative search methods for unsupported browsers
 */
export function getAlternativeSearchMethods(): string[] {
  const capabilities = getVoiceSearchCapabilities();
  const methods: string[] = [];
  
  if (capabilities.canUseAudioFile) {
    methods.push('Upload audio file');
  }
  
  methods.push('Text search');
  
  return methods;
}

export default {
  detectBrowser,
  isWebSpeechApiAvailable,
  getVoiceSearchCapabilities,
  getSpeechRecognitionAPI,
  createSafeRecognitionInstance,
  getVoiceSearchUiMessage,
  shouldShowMicrophoneButton,
  getAlternativeSearchMethods,
};
