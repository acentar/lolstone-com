/**
 * Polyfills for Solana web3.js in React Native/Expo
 */

import { Buffer } from 'buffer';

// Polyfill Buffer globally
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
}

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

