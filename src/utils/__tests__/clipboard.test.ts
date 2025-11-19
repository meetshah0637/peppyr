/**
 * Unit tests for clipboard utility functions
 * Tests both modern API and fallback functionality
 */

import { clipboard, ClipboardError } from '../clipboard';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn()
};

// Mock document.execCommand
const mockExecCommand = jest.fn();

// Mock document.createElement and related methods
const mockTextArea = {
  value: '',
  style: {},
  focus: jest.fn(),
  select: jest.fn()
};

const mockCreateElement = jest.fn(() => mockTextArea);
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

// Setup mocks
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true
});

Object.defineProperty(document, 'execCommand', {
  value: mockExecCommand,
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true
});

describe('clipboard utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTextArea.value = '';
  });

  describe('copyText', () => {
    it('should use modern clipboard API when available', async () => {
      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true
      });

      mockClipboard.writeText.mockResolvedValue(undefined);

      await clipboard.copyText('test text');

      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(mockExecCommand).not.toHaveBeenCalled();
    });

    it('should fallback to execCommand when modern API fails', async () => {
      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true
      });

      mockClipboard.writeText.mockRejectedValue(new Error('Permission denied'));
      mockExecCommand.mockReturnValue(true);

      await clipboard.copyText('test text');

      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(mockCreateElement).toHaveBeenCalledWith('textarea');
      expect(mockTextArea.value).toBe('test text');
    });

    it('should use execCommand fallback when not in secure context', async () => {
      // Mock non-secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        writable: true
      });

      mockExecCommand.mockReturnValue(true);

      await clipboard.copyText('test text');

      expect(mockClipboard.writeText).not.toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(mockTextArea.value).toBe('test text');
    });

    it('should throw ClipboardError when both methods fail', async () => {
      // Mock non-secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        writable: true
      });

      mockExecCommand.mockReturnValue(false);

      await expect(clipboard.copyText('test text')).rejects.toThrow(ClipboardError);
    });

    it('should throw ClipboardError when execCommand throws', async () => {
      // Mock non-secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        writable: true
      });

      mockExecCommand.mockImplementation(() => {
        throw new Error('execCommand failed');
      });

      await expect(clipboard.copyText('test text')).rejects.toThrow(ClipboardError);
    });
  });

  describe('isSupported', () => {
    it('should return true when clipboard API is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      expect(clipboard.isSupported()).toBe(true);
    });

    it('should return true when only execCommand is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });

      expect(clipboard.isSupported()).toBe(true);
    });

    it('should return false when neither is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });

      Object.defineProperty(document, 'execCommand', {
        value: undefined,
        writable: true
      });

      expect(clipboard.isSupported()).toBe(false);
    });
  });
});

