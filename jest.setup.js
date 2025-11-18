// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Load .env.local file for tests (before any other imports that might need env vars)
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envLocalPath = resolve(__dirname, '.env.local');
  const envFile = readFileSync(envLocalPath, 'utf-8');
  
  // Parse .env.local file (simple key=value parser)
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    // Parse KEY=VALUE format
    const match = trimmedLine.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      // Only set if not already set (env vars take precedence)
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = cleanValue.trim();
      }
    }
  });
} catch (error) {
  // .env.local doesn't exist or can't be read - that's okay, tests can use env vars directly
  // Silently continue - this is expected in CI environments
}

// Pre-import @react-email/render to ensure it's available for Resend's dynamic import
// This must be done before any modules that use Resend are imported
// Also make it available globally so Resend's dynamic import can find it
try {
  const renderModule = require('@react-email/render');
  // Make it available globally for Resend's dynamic import
  global.__REACT_EMAIL_RENDER__ = renderModule;
  // Also ensure the module can be resolved via import()
  if (typeof global.require !== 'undefined') {
    // Ensure the module is in the require cache
    require.cache[require.resolve('@react-email/render')] = {
      exports: renderModule,
      loaded: true,
    };
  }
} catch (e) {
  // Silently fail - package might not be installed in some environments
  console.warn('Failed to pre-load @react-email/render:', e.message);
}

// Polyfill TextDecoder/TextEncoder for React Email components
// These are needed by @react-email/components in Jest environment
if (typeof global.TextDecoder === 'undefined') {
  const { TextDecoder, TextEncoder } = require('util');
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
}

// Polyfill Request and Response for Jest with jsdom
// Node.js 18+ has these built-in, but jsdom doesn't expose them
// Create minimal polyfills instead of using undici (which requires many Web APIs)
if (typeof global.Request === 'undefined') {
  // Minimal Headers polyfill (defined first as it's used by Request/Response)
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {}
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => {
            this._headers[key.toLowerCase()] = value
          })
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value
          })
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value
          })
        }
      }
    }

    get(name) {
      return this._headers[name.toLowerCase()] || null
    }

    set(name, value) {
      this._headers[name.toLowerCase()] = value
    }

    has(name) {
      return name.toLowerCase() in this._headers
    }

    forEach(callback) {
      Object.entries(this._headers).forEach(([key, value]) => {
        callback(value, key, this)
      })
    }
  }

  // Minimal Request polyfill
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers)
      this.body = init.body || null
      this.bodyUsed = false
    }

    async text() {
      if (this.bodyUsed) throw new Error('Body already used')
      this.bodyUsed = true
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }

    async json() {
      const text = await this.text()
      return JSON.parse(text)
    }
  }

  // Minimal Response polyfill
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers)
      this.ok = this.status >= 200 && this.status < 300
      this.bodyUsed = false
    }

    async json() {
      if (this.bodyUsed) throw new Error('Body already used')
      this.bodyUsed = true
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }

    async text() {
      if (this.bodyUsed) throw new Error('Body already used')
      this.bodyUsed = true
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }

    static json(data, init = {}) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      })
    }
  }
}

// Polyfill MessageChannel for React/React Email components in Jest environment
// MessageChannel is needed by some libraries in the React Email stack
if (typeof global.MessageChannel === 'undefined') {
  // Use a minimal polyfill that doesn't create real MessagePorts
  // This prevents Jest from detecting open handles
  global.MessageChannel = class MessageChannel {
    constructor() {
      // Create mock ports that don't leave handles open
      this.port1 = {
        postMessage: jest.fn(),
        onmessage: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        start: jest.fn(),
      };
      this.port2 = {
        postMessage: jest.fn(),
        onmessage: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        start: jest.fn(),
      };
    }
  };
}

// Polyfill ReadableStream for React DOM server rendering in Jest environment
// React DOM uses ReadableStream when rendering to a stream in browser-like environments
if (typeof global.ReadableStream === 'undefined') {
  try {
    const { ReadableStream } = require('web-streams-polyfill');
    global.ReadableStream = ReadableStream;
  } catch (error) {
    // Fallback minimal ReadableStream polyfill if web-streams-polyfill is not available
    console.warn('web-streams-polyfill not available, using minimal ReadableStream polyfill');
    global.ReadableStream = class ReadableStream {
      constructor() {
        // Minimal implementation for React DOM's needs
        this.locked = false;
        this.getReader = jest.fn(() => ({
          read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: jest.fn(),
        }));
      }

      // Add pipeTo method needed by @react-email/render
      pipeTo(destination, options = {}) {
        // Simplified implementation for testing - just resolve immediately
        return Promise.resolve();
      }
    };
  }
}

// Polyfill WritableStream for @react-email/render in Jest environment
// @react-email/render uses WritableStream for processing email templates
if (typeof global.WritableStream === 'undefined') {
  try {
    const { WritableStream } = require('web-streams-polyfill');
    global.WritableStream = WritableStream;
  } catch (error) {
    // Fallback minimal WritableStream polyfill if web-streams-polyfill is not available
    console.warn('web-streams-polyfill not available, using minimal WritableStream polyfill');
    global.WritableStream = class WritableStream {
      constructor() {
        this.locked = false;
        this.abort = jest.fn();
        this.close = jest.fn().mockResolvedValue();
        this.getWriter = jest.fn(() => ({
          write: jest.fn().mockResolvedValue(),
          close: jest.fn().mockResolvedValue(),
          abort: jest.fn(),
          desiredSize: null,
          ready: Promise.resolve(),
        }));
      }

      // Add pipeTo method needed by @react-email/render
      pipeTo(destination, options = {}) {
        // Simplified implementation for testing - just resolve immediately
        return Promise.resolve();
      }
    };
  }
}

