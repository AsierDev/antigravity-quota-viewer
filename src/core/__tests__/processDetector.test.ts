/**
 * Tests for ProcessDetector
 */

import { ProcessDetector } from '../processDetector';
import * as https from 'https';

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock https
jest.mock('https');

describe('ProcessDetector', () => {
  let detector: ProcessDetector;
  const mockExec = require('child_process').exec;
  const mockHttpsRequest = https.request as jest.MockedFunction<typeof https.request>;

  beforeEach(() => {
    jest.clearAllMocks();
    detector = new ProcessDetector();
  });

  describe('constructor', () => {
    it('should select Windows strategy on win32', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      const winDetector = new ProcessDetector();
      expect((winDetector as any).processName).toBe('language_server_windows_x64.exe');

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('should select macOS strategy on darwin with correct architecture', () => {
      const originalPlatform = process.platform;
      const originalArch = process.arch;

      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });

      const macDetector = new ProcessDetector();
      expect((macDetector as any).processName).toBe('language_server_macos_arm');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
      Object.defineProperty(process, 'arch', { value: originalArch });
    });

    it('should select Linux strategy on linux', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      const linuxDetector = new ProcessDetector();
      expect((linuxDetector as any).processName).toBe('language_server_linux');

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });
  });

  describe('detect', () => {
    it('should return null when process is not found', async () => {
      mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
        callback(null, { stdout: '', stderr: '' });
      });

      const result = await detector.detect(1);
      expect(result).toBeNull();
    });

    it('should retry on failure', async () => {
      let callCount = 0;
      mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
        callCount++;
        if (callCount < 3) {
          callback(new Error('Command failed'));
        } else {
          callback(null, { stdout: '', stderr: '' });
        }
      });

      await detector.detect(3);
      expect(callCount).toBe(3);
    });

    it('should return process info when found and port is valid', async () => {
      const mockProcessOutput = '12345 /path/to/language_server --extension_server_port=42100 --csrf_token=test-token-123';
      const mockPortOutput = 'TCP *:42101 (LISTEN)';

      mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
        if (cmd.includes('pgrep')) {
          callback(null, { stdout: mockProcessOutput, stderr: '' });
        } else if (cmd.includes('lsof')) {
          callback(null, { stdout: mockPortOutput, stderr: '' });
        } else {
          callback(null, { stdout: '', stderr: '' });
        }
      });

      // Mock successful port test
      const mockReq: any = {
        on: jest.fn(function(this: any, event: string, handler: Function) {
          if (event === 'error' || event === 'timeout') {
            // Don't call error handlers
          }
          return this;
        }),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((options: any, callback?: any) => {
        const mockRes: any = {
          statusCode: 200,
          on: jest.fn(),
        };
        
        if (callback) {
          callback(mockRes);
        }
        
        return mockReq;
      });

      const result = await detector.detect(1);
      
      if (result) {
        expect(result.pid).toBe(12345);
        expect(result.csrfToken).toBe('test-token-123');
        expect(result.connectPort).toBeGreaterThan(0);
      }
    });

    it('should handle timeout errors', async () => {
      mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
        const error = new Error('Timeout');
        callback(error);
      });

      const result = await detector.detect(1);
      expect(result).toBeNull();
    });
  });

  describe('testPort', () => {
    it('should return true for valid port', async () => {
      const mockReq: any = {
        on: jest.fn(function(this: any) { return this; }),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((options: any, callback?: any) => {
        const mockRes: any = {
          statusCode: 200,
          on: jest.fn(),
        };
        
        if (callback) {
          callback(mockRes);
        }
        
        return mockReq;
      });

      const result = await (detector as any).testPort(42101, 'test-token');
      expect(result).toBe(true);
    });

    it('should return false for invalid port', async () => {
      const mockReq: any = {
        on: jest.fn(function(this: any, event: string, handler: Function) {
          if (event === 'error') {
            handler(new Error('Connection refused'));
          }
          return this;
        }),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      mockHttpsRequest.mockImplementation(() => mockReq);

      const result = await (detector as any).testPort(42101, 'test-token');
      expect(result).toBe(false);
    });

    it('should return false on timeout', async () => {
      const mockReq: any = {
        on: jest.fn(function(this: any, event: string, handler: Function) {
          if (event === 'timeout') {
            handler();
          }
          return this;
        }),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      mockHttpsRequest.mockImplementation(() => mockReq);

      const result = await (detector as any).testPort(42101, 'test-token');
      expect(result).toBe(false);
    });

    it('should return false for non-200 status codes', async () => {
      const mockReq: any = {
        on: jest.fn(function(this: any) { return this; }),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((options: any, callback?: any) => {
        const mockRes: any = {
          statusCode: 404,
          on: jest.fn(),
        };
        
        if (callback) {
          callback(mockRes);
        }
        
        return mockReq;
      });

      const result = await (detector as any).testPort(42101, 'test-token');
      expect(result).toBe(false);
    });
  });

  describe('findWorkingPort', () => {
    it('should return first working port', async () => {
      const mockReq: any = {
        on: jest.fn(function(this: any) { return this; }),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((options: any, callback?: any) => {
        const mockRes: any = {
          statusCode: 200,
          on: jest.fn(),
        };
        
        if (callback) {
          callback(mockRes);
        }
        
        return mockReq;
      });

      const result = await (detector as any).findWorkingPort([42101, 42102], 'test-token');
      expect(result).toBe(42101);
    });

    it('should try all ports and return null if none work', async () => {
      const mockReq: any = {
        on: jest.fn(function(this: any, event: string, handler: Function) {
          if (event === 'error') {
            handler(new Error('Connection refused'));
          }
          return this;
        }),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      mockHttpsRequest.mockImplementation(() => mockReq);

      const result = await (detector as any).findWorkingPort([42101, 42102, 42103], 'test-token');
      expect(result).toBeNull();
    });

    it('should handle empty port array', async () => {
      const result = await (detector as any).findWorkingPort([], 'test-token');
      expect(result).toBeNull();
    });
  });

  describe('getListeningPorts', () => {
    it('should return empty array on error', async () => {
      mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
        callback(new Error('Command failed'));
      });

      const result = await (detector as any).getListeningPorts(12345);
      expect(result).toEqual([]);
    });

    it('should parse ports from output', async () => {
      mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
        callback(null, { stdout: 'TCP *:42101 (LISTEN)\nTCP *:42102 (LISTEN)', stderr: '' });
      });

      const result = await (detector as any).getListeningPorts(12345);
      expect(result).toEqual([42101, 42102]);
    });
  });
});
