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

    let displayText: string;
    let icon: string;

    const pinnedModels = config.pinnedModels || [];
    
    if (pinnedModels.length > 0) {
      // Show pinned model status if user has configured it
      const pinnedModel = snapshot.modelsWithInsights.find(
        m => pinnedModels.includes(m.modelId) || pinnedModels.includes(m.label)
      );
      
      if (pinnedModel) {
        icon = this.getHealthIcon(pinnedModel.remainingPercent, config.alertThreshold);
        displayText = `${this.getShortName(pinnedModel.label)}: ${pinnedModel.remainingPercent}%`;
      } else {
        icon = this.getHealthIcon(snapshot.overallHealth, config.alertThreshold);
        displayText = `Quota: ${snapshot.overallHealth}%`;
      }
    } else {
      // Always show overall health - more reliable than trying to detect active model
      icon = this.getHealthIcon(snapshot.overallHealth, config.alertThreshold);
      displayText = `Quota: ${snapshot.overallHealth}%`;
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
   * Get short model name for status bar display
   * Returns a readable but compact name
   */
  private getShortName(label: string): string {
    // Claude models: "Claude Opus 4.5" -> "Claude Opus"
    if (label.includes('Claude')) {
      const match = label.match(/Claude\s+(\w+)/);
      if (match) {
        const variant = match[1]; // Opus, Sonnet, etc.
        return `Claude ${variant}`;
      }
      return 'Claude';
    }
    
    // Gemini models: "Gemini 3 Pro (High)" -> "Gemini Pro"
    if (label.includes('Gemini')) {
      const isHigh = label.includes('High');
      const isPro = label.includes('Pro');
      const isFlash = label.includes('Flash');
      
      let name = 'Gemini';
      if (isPro) name = 'Gemini Pro';
      else if (isFlash) name = 'Gemini Flash';
      
      // Add indicator for High tier
      if (isHigh) name += ' ↑';
      return name;
    }
    
    // GPT/OpenAI models
    if (label.includes('GPT')) {
      const match = label.match(/GPT[\s-]*(\S+)/);
      if (match) {
        return `GPT-${match[1]}`;
      }
      return 'GPT';
    }
    
    // O3 models
    if (label.includes('O3')) {
      return 'O3';
    }
    
    // Other models: take first two words or first 10 chars
    const words = label.split(' ');
    if (words.length >= 2) {
      return `${words[0]} ${words[1]}`.substring(0, 15);
    }
    return label.substring(0, 10);
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
   * Build tooltip content showing all models uniformly
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

    md.appendMarkdown(`**Models:**\n\n`);

    // Sort models by remaining percent (lowest first) for easy scanning
    const sortedModels = [...snapshot.modelsWithInsights]
      .sort((a, b) => a.remainingPercent - b.remainingPercent)
      .slice(0, 8);

    for (const model of sortedModels) {
      const status = this.getHealthEmoji(model.remainingPercent, 20);
      md.appendMarkdown(`${status} **${model.label}**: ${model.remainingPercent}%`);
      md.appendMarkdown(` ↳ Reset: ${model.timeUntilResetFormatted} | ETA Empty: ${model.insights.predictedExhaustionLabel}\n\n`);
    }

    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`*Click to open dashboard*`);

    return md;
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
