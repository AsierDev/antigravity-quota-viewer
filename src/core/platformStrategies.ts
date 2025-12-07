/**
 * Platform-specific strategies for detecting Antigravity process
 */

import { PlatformStrategy } from '../types';

/**
 * Windows strategy using PowerShell/wmic for process detection
 */
export class WindowsStrategy implements PlatformStrategy {
  private usePowerShell = true;

  /**
   * Check if a command line belongs to an Antigravity process
   */
  private isAntigravityProcess(commandLine: string): boolean {
    const lowerCmd = commandLine.toLowerCase();
    if (/--app_data_dir\s+antigravity\b/i.test(commandLine)) {
      return true;
    }
    if (lowerCmd.includes('\\antigravity\\') || lowerCmd.includes('/antigravity/')) {
      return true;
    }
    return false;
  }

  getProcessListCommand(processName: string): string {
    if (this.usePowerShell) {
      return `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"name='${processName}'\\" | Select-Object ProcessId,CommandLine | ConvertTo-Json"`;
    }
    return `wmic process where "name='${processName}'" get ProcessId,CommandLine /format:list`;
  }

  parseProcessInfo(stdout: string): { pid: number; extensionPort: number; csrfToken: string } | null {
    // Try JSON parsing first (PowerShell output)
    if (this.usePowerShell || stdout.trim().startsWith('{') || stdout.trim().startsWith('[')) {
      try {
        let data = JSON.parse(stdout.trim());
        
        if (Array.isArray(data)) {
          if (data.length === 0) return null;
          
          const antigravityProcesses = data.filter(
            (item: { CommandLine?: string }) => item.CommandLine && this.isAntigravityProcess(item.CommandLine)
          );
          
          if (antigravityProcesses.length === 0) {
            console.log('[WindowsStrategy] No Antigravity process found');
            return null;
          }
          
          data = antigravityProcesses[0];
        } else {
          if (!data.CommandLine || !this.isAntigravityProcess(data.CommandLine)) {
            return null;
          }
        }

        const commandLine = data.CommandLine || '';
        const pid = data.ProcessId;

        if (!pid) return null;

        const portMatch = commandLine.match(/--extension_server_port[=\s]+(\d+)/);
        const tokenMatch = commandLine.match(/--csrf_token[=\s]+([a-f0-9-]+)/i);

        if (!tokenMatch?.[1]) return null;

        return {
          pid,
          extensionPort: portMatch?.[1] ? parseInt(portMatch[1], 10) : 0,
          csrfToken: tokenMatch[1]
        };
      } catch {
        // Fall through to wmic parsing
      }
    }

    // WMIC format parsing
    const blocks = stdout.split(/\n\s*\n/).filter(block => block.trim().length > 0);
    
    for (const block of blocks) {
      const pidMatch = block.match(/ProcessId=(\d+)/);
      const commandLineMatch = block.match(/CommandLine=(.+)/);

      if (!pidMatch || !commandLineMatch) continue;

      const commandLine = commandLineMatch[1].trim();
      if (!this.isAntigravityProcess(commandLine)) continue;

      const portMatch = commandLine.match(/--extension_server_port[=\s]+(\d+)/);
      const tokenMatch = commandLine.match(/--csrf_token[=\s]+([a-f0-9-]+)/i);

      if (!tokenMatch?.[1]) continue;

      return {
        pid: parseInt(pidMatch[1], 10),
        extensionPort: portMatch?.[1] ? parseInt(portMatch[1], 10) : 0,
        csrfToken: tokenMatch[1]
      };
    }

    return null;
  }

  getPortListCommand(pid: number): string {
    return `netstat -ano | findstr "${pid}" | findstr "LISTENING"`;
  }

  parseListeningPorts(stdout: string): number[] {
    const portRegex = /(?:127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d+)\s+\S+\s+LISTENING/gi;
    const ports: number[] = [];
    let match;

    while ((match = portRegex.exec(stdout)) !== null) {
      const port = parseInt(match[1], 10);
      if (!ports.includes(port)) {
        ports.push(port);
      }
    }

    return ports.sort((a, b) => a - b);
  }
}

/**
 * Unix strategy (macOS/Linux) using pgrep and lsof/ss
 */
export class UnixStrategy implements PlatformStrategy {
  constructor(private platform: 'darwin' | 'linux') {}

  getProcessListCommand(processName: string): string {
    return `pgrep -fl ${processName}`;
  }

  parseProcessInfo(stdout: string): { pid: number; extensionPort: number; csrfToken: string } | null {
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      if (line.includes('--extension_server_port')) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[0], 10);
        const cmd = line.substring(parts[0].length).trim();

        const portMatch = cmd.match(/--extension_server_port[=\s]+(\d+)/);
        const tokenMatch = cmd.match(/--csrf_token[=\s]+([a-zA-Z0-9-]+)/);

        return {
          pid,
          extensionPort: portMatch ? parseInt(portMatch[1], 10) : 0,
          csrfToken: tokenMatch ? tokenMatch[1] : ''
        };
      }
    }
    
    return null;
  }

  getPortListCommand(pid: number): string {
    if (this.platform === 'darwin') {
      return `lsof -iTCP -sTCP:LISTEN -n -P -p ${pid}`;
    }
    return `ss -tlnp 2>/dev/null | grep "pid=${pid}" || lsof -iTCP -sTCP:LISTEN -n -P -p ${pid} 2>/dev/null`;
  }

  parseListeningPorts(stdout: string): number[] {
    const ports: number[] = [];

    if (this.platform === 'darwin') {
      // lsof format: TCP *:42424 (LISTEN)
      const lsofRegex = /(?:TCP|UDP)\s+(?:\*|[\d.]+|\[[\da-f:]+\]):(\d+)\s+\(LISTEN\)/gi;
      let match;
      while ((match = lsofRegex.exec(stdout)) !== null) {
        const port = parseInt(match[1], 10);
        if (!ports.includes(port)) {
          ports.push(port);
        }
      }
    } else {
      // ss format: LISTEN 0 128 *:42424
      const ssRegex = /LISTEN\s+\d+\s+\d+\s+(?:\*|[\d.]+|\[[\da-f:]*\]):(\d+)/gi;
      let match;
      while ((match = ssRegex.exec(stdout)) !== null) {
        const port = parseInt(match[1], 10);
        if (!ports.includes(port)) {
          ports.push(port);
        }
      }

      // Fallback to lsof format if ss didn't find ports
      if (ports.length === 0) {
        const lsofRegex = /(?:TCP|UDP)\s+(?:\*|[\d.]+|\[[\da-f:]+\]):(\d+)\s+\(LISTEN\)/gi;
        while ((match = lsofRegex.exec(stdout)) !== null) {
          const port = parseInt(match[1], 10);
          if (!ports.includes(port)) {
            ports.push(port);
          }
        }
      }
    }

    return ports.sort((a, b) => a - b);
  }
}
