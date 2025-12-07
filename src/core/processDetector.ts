/**
 * Process Detector Service
 * Detects Antigravity's language server process and extracts connection info
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as https from 'https';
import * as process from 'process';
import { ProcessInfo, PlatformStrategy } from '../types';
import { WindowsStrategy, UnixStrategy } from './platformStrategies';

const execAsync = promisify(exec);

export class ProcessDetector {
  private strategy: PlatformStrategy;
  private processName: string;

  constructor() {
    if (process.platform === 'win32') {
      this.strategy = new WindowsStrategy();
      this.processName = 'language_server_windows_x64.exe';
    } else if (process.platform === 'darwin') {
      this.strategy = new UnixStrategy('darwin');
      this.processName = `language_server_macos${process.arch === 'arm64' ? '_arm' : ''}`;
    } else {
      this.strategy = new UnixStrategy('linux');
      this.processName = 'language_server_linux';
    }
  }

  /**
   * Detect Antigravity process and return connection info
   */
  async detect(maxRetries = 3): Promise<ProcessInfo | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const cmd = this.strategy.getProcessListCommand(this.processName);
        console.log(`[ProcessDetector] Executing: ${cmd}`);
        
        const { stdout } = await execAsync(cmd, { timeout: 5000 });
        const info = this.strategy.parseProcessInfo(stdout);

        if (info) {
          const ports = await this.getListeningPorts(info.pid);
          console.log(`[ProcessDetector] Found ports: ${ports.join(', ')}`);

          if (ports.length > 0) {
            const validPort = await this.findWorkingPort(ports, info.csrfToken);
            
            if (validPort) {
              console.log(`[ProcessDetector] Valid port found: ${validPort}`);
              return {
                pid: info.pid,
                extensionPort: info.extensionPort,
                connectPort: validPort,
                csrfToken: info.csrfToken
              };
            }
          }
        }
      } catch (error) {
        console.error(`[ProcessDetector] Attempt ${i + 1} failed:`, error);
      }

      // Wait before retry
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return null;
  }

  /**
   * Get listening ports for a process
   */
  private async getListeningPorts(pid: number): Promise<number[]> {
    try {
      const cmd = this.strategy.getPortListCommand(pid);
      const { stdout } = await execAsync(cmd, { timeout: 3000 });
      return this.strategy.parseListeningPorts(stdout);
    } catch {
      return [];
    }
  }

  /**
   * Find a working port by testing the API
   */
  private async findWorkingPort(ports: number[], csrfToken: string): Promise<number | null> {
    for (const port of ports) {
      if (await this.testPort(port, csrfToken)) {
        return port;
      }
    }
    return null;
  }

  /**
   * Test if a port responds to the Antigravity API
   */
  private testPort(port: number, csrfToken: string): Promise<boolean> {
    return new Promise(resolve => {
      const options: https.RequestOptions = {
        hostname: '127.0.0.1',
        port,
        path: '/exa.language_server_pb.LanguageServerService/GetUnleashData',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Codeium-Csrf-Token': csrfToken,
          'Connect-Protocol-Version': '1'
        },
        rejectUnauthorized: false,
        timeout: 1000
      };

      const req = https.request(options, res => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.write(JSON.stringify({ wrapper_data: {} }));
      req.end();
    });
  }
}
