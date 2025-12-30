/**
 * Polyfills for Solana web3.js in React Native/Expo
 * 
 * This file MUST be imported before any Solana libraries are used.
 * It provides Buffer and other Node.js polyfills for browser environments.
 */

import { Buffer } from 'buffer';

// Polyfill Buffer globally - ensure it's available everywhere
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
}
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Also set it directly on the global object as a fallback
try {
  if (!globalThis.Buffer) globalThis.Buffer = Buffer;
} catch (e) {}

console.log('Polyfills loaded - Buffer available:', typeof Buffer !== 'undefined');

// Polyfill process if needed
if (typeof globalThis !== 'undefined' && !globalThis.process) {
  globalThis.process = {
    env: {},
    version: '',
    nextTick: (fn) => setTimeout(fn, 0),
  };
}
if (typeof global !== 'undefined' && !global.process) {
  global.process = {
    env: {},
    version: '',
    nextTick: (fn) => setTimeout(fn, 0),
  };
}

// Polyfill crypto.getRandomValues if not available
const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : (typeof global !== 'undefined' ? global.crypto : undefined);
if (!cryptoObj || !cryptoObj.getRandomValues) {
  const cryptoPolyfill = {
    ...cryptoObj,
    getRandomValues: function (array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
  };

  if (typeof globalThis !== 'undefined') {
    globalThis.crypto = cryptoPolyfill;
  }
  if (typeof global !== 'undefined') {
    global.crypto = cryptoPolyfill;
  }
}

