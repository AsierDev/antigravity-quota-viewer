/**
 * Dashboard Panel
 * Manages the WebView panel for the quota dashboard
 */

import * as vscode from 'vscode';
import { SnapshotWithInsights } from '../../types';
import { generateDashboardHtml } from './dashboardHtml';

export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private static readonly viewType = 'quotaViewerDashboard';

  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, private extensionUri: vscode.Uri) {
    this.panel = panel;

    // Handle panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'refresh':
            vscode.commands.executeCommand('quotaViewer.refresh');
            break;
          case 'pinModel':
            this.pinModel(message.modelId);
            break;
        }
      },
      null,
      this.disposables
    );
  }

  /**
   * Create or show the dashboard panel
   */
  public static createOrShow(extensionUri: vscode.Uri): DashboardPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If panel exists, show it
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal(column);
      return DashboardPanel.currentPanel;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      DashboardPanel.viewType,
      'Quota Dashboard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
    return DashboardPanel.currentPanel;
  }

  /**
   * Update dashboard with new data
   */
  public update(snapshot: SnapshotWithInsights): void {
    const nonce = this.getNonce();
    this.panel.webview.html = generateDashboardHtml(snapshot, nonce);
  }

  /**
   * Show loading state
   */
  public showLoading(): void {
    this.panel.webview.html = this.getLoadingHtml();
  }

  /**
   * Show error state
   */
  public showError(message: string): void {
    this.panel.webview.html = this.getErrorHtml(message);
  }

  /**
   * Pin a model to status bar
   */
  private async pinModel(modelId: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('quotaViewer');
    const pinnedModels = config.get<string[]>('pinnedModels', []);
    
    if (!pinnedModels.includes(modelId)) {
      pinnedModels.push(modelId);
      await config.update('pinnedModels', pinnedModels, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Pinned ${modelId} to status bar`);
    }
  }

  /**
   * Generate a random nonce for CSP
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Get loading HTML
   */
  private getLoadingHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d1117;
      color: #e6edf3;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .loader {
      text-align: center;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #30363d;
      border-top-color: #58a6ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Loading quota data...</p>
  </div>
</body>
</html>`;
  }

  /**
   * Get error HTML
   */
  private getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d1117;
      color: #e6edf3;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .error {
      text-align: center;
      padding: 24px;
    }
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .error-message {
      color: #f85149;
      margin-bottom: 16px;
    }
    .retry-btn {
      background: #238636;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    .retry-btn:hover {
      background: #2ea043;
    }
  </style>
</head>
<body>
  <div class="error">
    <div class="error-icon">⚠️</div>
    <p class="error-message">${message}</p>
    <button class="retry-btn" onclick="vscode.postMessage({command: 'refresh'})">Retry</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
  </script>
</body>
</html>`;
  }

  /**
   * Dispose of the panel
   */
  public dispose(): void {
    DashboardPanel.currentPanel = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
