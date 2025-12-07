/**
 * Antigravity Quota Viewer Extension
 * Main entry point
 */

import * as vscode from 'vscode';
import { ProcessDetector } from './core/processDetector';
import { QuotaService } from './core/quotaService';
import { InsightsService } from './insights/insightsService';
import { StatusBarManager } from './ui/statusBar';
import { DashboardPanel } from './ui/dashboard/dashboardPanel';
import { ExtensionConfig, SnapshotWithInsights } from './types';

let processDetector: ProcessDetector;
let quotaService: QuotaService;
let insightsService: InsightsService;
let statusBarManager: StatusBarManager;
let pollingInterval: NodeJS.Timeout | undefined;
let isInitialized = false;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('⚡ Antigravity Quota Viewer activating...');

  // Initialize services
  processDetector = new ProcessDetector();
  quotaService = new QuotaService();
  insightsService = new InsightsService();
  statusBarManager = new StatusBarManager();

  context.subscriptions.push(statusBarManager);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('quotaViewer.showDashboard', async () => {
      await showDashboard(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('quotaViewer.refresh', async () => {
      vscode.window.showInformationMessage('Refreshing quota data...');
      await pollAndUpdate(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('quotaViewer.showQuickStatus', () => {
      showQuickStatus();
    })
  );

  // Handle configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('quotaViewer')) {
        const config = getConfig();
        if (config.enabled) {
          startPolling(config.pollingInterval * 1000, context);
        } else {
          stopPolling();
        }
      }
    })
  );

  // Initialize extension
  await initialize(context);
}

/**
 * Get extension configuration
 */
function getConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('quotaViewer');
  return {
    enabled: config.get('enabled', true),
    pollingInterval: config.get('pollingInterval', 120),
    pinnedModels: config.get('pinnedModels', []),
    alertThreshold: config.get('alertThreshold', 20)
  };
}

/**
 * Initialize the extension
 */
async function initialize(context: vscode.ExtensionContext): Promise<void> {
  if (isInitialized) return;

  const config = getConfig();
  statusBarManager.showDetecting();

  try {
    const processInfo = await processDetector.detect();

    if (processInfo) {
      console.log(`⚡ Antigravity detected on port ${processInfo.connectPort}`);
      quotaService.setConnection(processInfo.connectPort, processInfo.csrfToken);

      // Initial poll
      await pollAndUpdate(context);

      // Start polling if enabled
      if (config.enabled) {
        startPolling(config.pollingInterval * 1000, context);
      }

      isInitialized = true;
    } else {
      statusBarManager.showError('Antigravity not found');
      vscode.window.showWarningMessage(
        'Quota Viewer: Could not detect Antigravity process. Is it running?',
        'Retry'
      ).then(action => {
        if (action === 'Retry') {
          initialize(context);
        }
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Initialization failed:', error);
    statusBarManager.showError(message);
  }
}

/**
 * Poll for quota data and update UI
 */
async function pollAndUpdate(context: vscode.ExtensionContext): Promise<void> {
  if (!quotaService.isConfigured()) {
    await initialize(context);
    return;
  }

  statusBarManager.showFetching();

  try {
    await quotaService.poll();
    const snapshot = quotaService.getSnapshot();

    if (snapshot) {
      const enrichedSnapshot = insightsService.analyze(snapshot);
      const config = getConfig();
      
      statusBarManager.update(enrichedSnapshot, config);

      // Update dashboard if open
      if (DashboardPanel.currentPanel) {
        DashboardPanel.currentPanel.update(enrichedSnapshot);
      }

      // Check for warnings
      checkForWarnings(enrichedSnapshot, config);
    } else {
      statusBarManager.showError('No data received');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Poll failed:', error);
    statusBarManager.showError(message);
  }
}

/**
 * Start polling interval
 */
function startPolling(intervalMs: number, context: vscode.ExtensionContext): void {
  stopPolling();
  
  pollingInterval = setInterval(async () => {
    await pollAndUpdate(context);
  }, intervalMs);

  console.log(`⚡ Polling started: every ${intervalMs / 1000}s`);
}

/**
 * Stop polling interval
 */
function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = undefined;
    console.log('⚡ Polling stopped');
  }
}

/**
 * Show the dashboard
 */
async function showDashboard(context: vscode.ExtensionContext): Promise<void> {
  const panel = DashboardPanel.createOrShow(context.extensionUri);
  panel.showLoading();

  const snapshot = quotaService.getSnapshot();
  
  if (snapshot) {
    const enrichedSnapshot = insightsService.analyze(snapshot);
    panel.update(enrichedSnapshot);
  } else {
    // Try to fetch data
    await pollAndUpdate(context);
    const newSnapshot = quotaService.getSnapshot();
    
    if (newSnapshot) {
      const enrichedSnapshot = insightsService.analyze(newSnapshot);
      panel.update(enrichedSnapshot);
    } else {
      panel.showError('Could not fetch quota data');
    }
  }
}

/**
 * Show quick status via QuickPick
 */
function showQuickStatus(): void {
  const snapshot = quotaService.getSnapshot();
  
  if (!snapshot) {
    vscode.window.showWarningMessage('No quota data available');
    return;
  }

  const enrichedSnapshot = insightsService.analyze(snapshot);

  const items: vscode.QuickPickItem[] = [
    {
      label: `📊 Overall Health: ${enrichedSnapshot.overallHealth}% (${enrichedSnapshot.healthLabel})`,
      description: `Session usage: ${enrichedSnapshot.totalSessionUsage}%`,
      detail: ''
    },
    { label: '', kind: vscode.QuickPickItemKind.Separator },
    ...enrichedSnapshot.modelsWithInsights.map(m => ({
      label: `${m.insights.isActive ? '▶ ' : ''}${m.label}`,
      description: `${m.remainingPercent}% remaining`,
      detail: `Reset: ${m.timeUntilResetFormatted} | Burn: ${m.insights.burnRateLabel} | ETA: ${m.insights.predictedExhaustionLabel}`
    }))
  ];

  if (enrichedSnapshot.promptCredits) {
    items.push(
      { label: '', kind: vscode.QuickPickItemKind.Separator },
      {
        label: `💳 Prompt Credits`,
        description: `${enrichedSnapshot.promptCredits.available.toLocaleString()} / ${enrichedSnapshot.promptCredits.monthly.toLocaleString()}`,
        detail: `${Math.round(enrichedSnapshot.promptCredits.remainingPercentage)}% remaining`
      }
    );
  }

  vscode.window.showQuickPick(items, {
    placeHolder: 'Quota Status',
    title: '⚡ Antigravity Quota Viewer'
  });
}

/**
 * Check for low quota warnings
 */
function checkForWarnings(snapshot: SnapshotWithInsights, config: ExtensionConfig): void {
  const lowModels = snapshot.modelsWithInsights.filter(
    m => m.remainingPercent > 0 && m.remainingPercent <= config.alertThreshold
  );

  for (const model of lowModels) {
    if (model.insights.isActive) {
      vscode.window.showWarningMessage(
        `⚠️ ${model.label} quota is low: ${model.remainingPercent}% remaining (ETA: ${model.insights.predictedExhaustionLabel})`,
        'Open Dashboard'
      ).then(action => {
        if (action === 'Open Dashboard') {
          vscode.commands.executeCommand('quotaViewer.showDashboard');
        }
      });
      break; // Only show one warning at a time
    }
  }
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  stopPolling();
  console.log('⚡ Antigravity Quota Viewer deactivated');
}
