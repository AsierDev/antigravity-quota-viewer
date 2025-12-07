/**
 * Status Bar Manager
 * Displays quota status in VS Code's status bar
 */

import * as vscode from 'vscode';
import { SnapshotWithInsights, ModelWithInsights, ExtensionConfig } from '../types';

export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private currentSnapshot: SnapshotWithInsights | null = null;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'quotaViewer.showDashboard';
    this.statusBarItem.show();
    this.showInitializing();
  }

  /**
   * Show initializing state
   */
  showInitializing(): void {
    this.statusBarItem.text = '$(sync~spin) Quota';
    this.statusBarItem.tooltip = 'Initializing Quota Viewer...';
    this.statusBarItem.backgroundColor = undefined;
  }

  /**
   * Show detecting state
   */
  showDetecting(): void {
    this.statusBarItem.text = '$(search) Quota';
    this.statusBarItem.tooltip = 'Detecting Antigravity process...';
  }

  /**
   * Show fetching state
   */
  showFetching(): void {
    this.statusBarItem.text = '$(sync~spin) Quota';
    this.statusBarItem.tooltip = 'Fetching quota data...';
  }

  /**
   * Show error state
   */
  showError(message: string): void {
    this.statusBarItem.text = '$(error) Quota';
    this.statusBarItem.tooltip = `Error: ${message}`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }

  /**
   * Update with new snapshot data
   */
  update(snapshot: SnapshotWithInsights, config: ExtensionConfig): void {
    this.currentSnapshot = snapshot;

    // Determine what to show based on pinned models or health
    let displayText: string;
    let icon: string;

    const pinnedModels = config.pinnedModels || [];
    
    if (pinnedModels.length > 0) {
      // Show pinned model status
      const pinnedModel = snapshot.modelsWithInsights.find(
        m => pinnedModels.includes(m.modelId) || pinnedModels.includes(m.label)
      );
      
      if (pinnedModel) {
        icon = this.getHealthIcon(pinnedModel.remainingPercent, config.alertThreshold);
        displayText = `${this.getShortName(pinnedModel.label)}: ${pinnedModel.remainingPercent}%`;
      } else {
        icon = this.getHealthIcon(snapshot.overallHealth, config.alertThreshold);
        displayText = `Health: ${snapshot.overallHealth}%`;
      }
    } else {
      // Show overall health or active model
      const activeModel = snapshot.modelsWithInsights.find(m => m.insights.isActive);
      
      if (activeModel) {
        icon = this.getHealthIcon(activeModel.remainingPercent, config.alertThreshold);
        displayText = `${this.getShortName(activeModel.label)}: ${activeModel.remainingPercent}%`;
      } else {
        icon = this.getHealthIcon(snapshot.overallHealth, config.alertThreshold);
        displayText = `Quota: ${snapshot.overallHealth}%`;
      }
    }

    this.statusBarItem.text = `${icon} ${displayText}`;
    this.statusBarItem.tooltip = this.buildTooltip(snapshot);
    this.statusBarItem.backgroundColor = this.getBackgroundColor(snapshot.overallHealth, config.alertThreshold);
  }

  /**
   * Get current snapshot
   */
  getSnapshot(): SnapshotWithInsights | null {
    return this.currentSnapshot;
  }

  /**
   * Get health icon based on percentage
   */
  private getHealthIcon(percent: number, threshold: number): string {
    if (percent <= 0) return '$(error)';
    if (percent <= threshold) return '$(warning)';
    return '$(check)';
  }

  /**
   * Get background color based on health
   */
  private getBackgroundColor(percent: number, threshold: number): vscode.ThemeColor | undefined {
    if (percent <= 0) {
      return new vscode.ThemeColor('statusBarItem.errorBackground');
    }
    if (percent <= threshold) {
      return new vscode.ThemeColor('statusBarItem.warningBackground');
    }
    return undefined;
  }

  /**
   * Get short model name
   */
  private getShortName(label: string): string {
    if (label.includes('Claude')) {
      const match = label.match(/Claude\s+(\w+)/);
      return match ? `C-${match[1].substring(0, 3)}` : 'Claude';
    }
    if (label.includes('Gemini')) {
      if (label.includes('Pro')) return 'G-Pro';
      if (label.includes('Flash')) return 'G-Flash';
      return 'Gemini';
    }
    if (label.includes('GPT')) return 'GPT';
    return label.split(' ')[0].substring(0, 5);
  }

  /**
   * Get health emoji for tooltips (Unicode instead of VS Code icons)
   */
  private getHealthEmoji(percent: number, threshold: number): string {
    if (percent <= 0) return '✗';
    if (percent <= threshold) return '⚠';
    return '✓';
  }

  /**
   * Build tooltip content
   */
  private buildTooltip(snapshot: SnapshotWithInsights): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    md.appendMarkdown(`### 📊 Quota Status\n\n`);
    md.appendMarkdown(`**Overall Health:** ${snapshot.overallHealth}% (${snapshot.healthLabel})\n\n`);
    
    if (snapshot.promptCredits) {
      md.appendMarkdown(`**Prompt Credits:** ${snapshot.promptCredits.available.toLocaleString()} / ${snapshot.promptCredits.monthly.toLocaleString()}\n\n`);
    }

    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`**Models:**\n\n`);

    for (const model of snapshot.modelsWithInsights.slice(0, 5)) {
      const icon = model.insights.isActive ? '▶ ' : '';
      const status = this.getHealthEmoji(model.remainingPercent, 20);
      md.appendMarkdown(`${icon}${status} **${model.label}**: ${model.remainingPercent}%\n`);
      md.appendMarkdown(`   ↳ Reset: ${model.timeUntilResetFormatted} | ETA: ${model.insights.predictedExhaustionLabel}\n\n`);
    }

    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`*Click to open dashboard*`);

    return md;
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
