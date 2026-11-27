/**
 * Jest setup: jest-dom matchers and jsdom polyfills required by react-router v7.
 */
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

Object.assign(globalThis, { TextEncoder, TextDecoder });
