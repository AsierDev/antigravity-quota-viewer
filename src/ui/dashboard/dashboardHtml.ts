/**
 * Dashboard HTML Generator
 * Creates the modern glassmorphism dashboard UI
 */

import { SnapshotWithInsights, ModelWithInsights, PromptCredits } from '../../types';

export function generateDashboardHtml(snapshot: SnapshotWithInsights, nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <title>Quota Dashboard</title>
  <style nonce="${nonce}">
    :root {
      --bg-primary: #0d1117;
      --bg-secondary: #161b22;
      --bg-card: rgba(22, 27, 34, 0.8);
      --border-color: rgba(48, 54, 61, 0.8);
      --text-primary: #e6edf3;
      --text-secondary: #8b949e;
      --text-muted: #6e7681;
      --accent-green: #3fb950;
      --accent-yellow: #d29922;
      --accent-red: #f85149;
      --accent-blue: #58a6ff;
      --accent-purple: #a371f7;
      --gradient-green: linear-gradient(135deg, #3fb950 0%, #238636 100%);
      --gradient-yellow: linear-gradient(135deg, #d29922 0%, #9e6a03 100%);
      --gradient-red: linear-gradient(135deg, #f85149 0%, #da3633 100%);
      --gradient-blue: linear-gradient(135deg, #58a6ff 0%, #1f6feb 100%);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.5;
      padding: 24px;
      min-height: 100vh;
    }

    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-title h1 {
      font-size: 28px;
      font-weight: 600;
      background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-title .icon {
      font-size: 32px;
    }

    .header-stats {
      display: flex;
      gap: 24px;
    }

    .stat-box {
      background: var(--bg-card);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px 24px;
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Health Ring */
    .health-ring {
      position: relative;
      width: 80px;
      height: 80px;
    }

    .health-ring svg {
      transform: rotate(-90deg);
    }

    .health-ring-bg {
      fill: none;
      stroke: var(--border-color);
      stroke-width: 8;
    }

    .health-ring-progress {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.5s ease;
    }

    .health-ring-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 18px;
      font-weight: 700;
    }

    /* Models Grid */
    .models-section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    /* Model Card */
    .model-card {
      background: var(--bg-card);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .model-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .model-card.active {
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 1px var(--accent-blue);
    }

    .model-card.exhausted {
      border-color: var(--accent-red);
      opacity: 0.7;
    }

    .model-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .model-name {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .model-name .active-badge {
      background: var(--gradient-blue);
      color: white;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }

    .model-percent {
      font-size: 28px;
      font-weight: 700;
    }

    /* Donut Chart */
    .donut-container {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 16px;
    }

    .donut {
      width: 80px;
      height: 80px;
      position: relative;
      flex-shrink: 0;
    }

    .donut svg {
      transform: rotate(-90deg);
    }

    .donut-bg {
      fill: none;
      stroke: var(--bg-secondary);
      stroke-width: 10;
    }

    .donut-progress {
      fill: none;
      stroke-width: 10;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s ease;
    }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .donut-value {
      font-size: 18px;
      font-weight: 700;
    }

    .donut-label {
      font-size: 10px;
      color: var(--text-muted);
    }

    /* Progress Bar */
    .progress-container {
      flex: 1;
    }

    .progress-bar {
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* Model Stats */
    .model-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .model-stat {
      display: flex;
      flex-direction: column;
    }

    .model-stat-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .model-stat-value {
      font-size: 14px;
      font-weight: 500;
    }

    .trend-stable { color: var(--accent-green); }
    .trend-decreasing { color: var(--accent-yellow); }
    .trend-warning { color: var(--accent-yellow); }
    .trend-critical { color: var(--accent-red); }

    /* Prompt Credits */
    .credits-section {
      background: var(--bg-card);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
    }

    .credits-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .credits-title {
      font-size: 16px;
      font-weight: 600;
    }

    .credits-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--accent-purple);
    }

    .credits-bar {
      height: 12px;
      background: var(--bg-secondary);
      border-radius: 6px;
      overflow: hidden;
    }

    .credits-fill {
      height: 100%;
      background: var(--gradient-blue);
      border-radius: 6px;
      transition: width 0.5s ease;
    }

    .credits-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      body {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
      }

      .header-stats {
        width: 100%;
        justify-content: center;
      }

      .models-grid {
        grid-template-columns: 1fr;
      }

      .donut-container {
        flex-direction: column;
        text-align: center;
      }
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .loading {
      animation: pulse 1.5s infinite;
    }

    /* Utility */
    .green { color: var(--accent-green); }
    .yellow { color: var(--accent-yellow); }
    .red { color: var(--accent-red); }
    .blue { color: var(--accent-blue); }
  </style>
</head>
<body>
  <div class="dashboard">
    ${generateHeaderHtml(snapshot)}
    ${generateModelsHtml(snapshot.modelsWithInsights)}
    ${snapshot.promptCredits ? generateCreditsHtml(snapshot.promptCredits) : ''}
  </div>
  <script nonce="${nonce}">
    // Animate progress on load
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.donut-progress').forEach(el => {
        const value = parseFloat(el.dataset.value) || 0;
        const circumference = 2 * Math.PI * 32;
        const offset = circumference - (value / 100) * circumference;
        el.style.strokeDashoffset = offset;
      });
    });
  </script>
</body>
</html>`;
}

function generateHeaderHtml(snapshot: SnapshotWithInsights): string {
  const healthColor = getHealthColor(snapshot.overallHealth);
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (snapshot.overallHealth / 100) * circumference;

  return `
    <header class="header">
      <div class="header-title">
        <span class="icon">⚡</span>
        <h1>Antigravity Quota Dashboard</h1>
      </div>
      <div class="header-stats">
        <div class="stat-box">
          <div class="health-ring">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle class="health-ring-bg" cx="40" cy="40" r="32"></circle>
              <circle 
                class="health-ring-progress" 
                cx="40" cy="40" r="32"
                stroke="${healthColor}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
              ></circle>
            </svg>
            <span class="health-ring-text" style="color: ${healthColor}">${snapshot.overallHealth}%</span>
          </div>
          <div class="stat-label">Overall Health</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${snapshot.modelsWithInsights.length}</div>
          <div class="stat-label">Active Models</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${snapshot.totalSessionUsage}%</div>
          <div class="stat-label">Session Usage</div>
        </div>
      </div>
    </header>
  `;
}

function generateModelsHtml(models: ModelWithInsights[]): string {
  const cards = models.map(model => generateModelCard(model)).join('');
  
  return `
    <section class="models-section">
      <h2 class="section-title">📊 Model Quotas</h2>
      <div class="models-grid">
        ${cards}
      </div>
    </section>
  `;
}

function generateModelCard(model: ModelWithInsights): string {
  const color = getHealthColor(model.remainingPercent);
  const circumference = 2 * Math.PI * 32;
  const cardClass = model.insights.isActive ? 'active' : (model.isExhausted ? 'exhausted' : '');

  return `
    <div class="model-card ${cardClass}">
      <div class="model-header">
        <div class="model-name">
          ${model.label}
          ${model.insights.isActive ? '<span class="active-badge">ACTIVE</span>' : ''}
        </div>
        <div class="model-percent" style="color: ${color}">${model.remainingPercent}%</div>
      </div>
      
      <div class="donut-container">
        <div class="donut">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle class="donut-bg" cx="40" cy="40" r="32"></circle>
            <circle 
              class="donut-progress" 
              cx="40" cy="40" r="32"
              stroke="${color}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference}"
              data-value="${model.remainingPercent}"
            ></circle>
          </svg>
          <div class="donut-center">
            <div class="donut-value">${model.remainingPercent}%</div>
            <div class="donut-label">remaining</div>
          </div>
        </div>
        
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${model.remainingPercent}%; background: ${color}"></div>
          </div>
          <div class="progress-labels">
            <span>0%</span>
            <span>Used: ${100 - model.remainingPercent}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      
      <div class="model-stats">
        <div class="model-stat">
          <span class="model-stat-label">Reset In</span>
          <span class="model-stat-value">${model.timeUntilResetFormatted}</span>
        </div>
        <div class="model-stat">
          <span class="model-stat-label">Burn Rate</span>
          <span class="model-stat-value trend-${model.insights.trendDirection}">${model.insights.burnRateLabel}</span>
        </div>
        <div class="model-stat">
          <span class="model-stat-label">ETA Empty</span>
          <span class="model-stat-value">${model.insights.predictedExhaustionLabel}</span>
        </div>
        <div class="model-stat">
          <span class="model-stat-label">Session Used</span>
          <span class="model-stat-value">${model.insights.sessionUsage}%</span>
        </div>
      </div>
    </div>
  `;
}

function generateCreditsHtml(credits: PromptCredits): string {
  const remaining = Math.round(credits.remainingPercentage);
  
  return `
    <section class="credits-section">
      <div class="credits-header">
        <span class="credits-title">💳 Prompt Credits</span>
        <span class="credits-value">${credits.available.toLocaleString()} / ${credits.monthly.toLocaleString()}</span>
      </div>
      <div class="credits-bar">
        <div class="credits-fill" style="width: ${remaining}%"></div>
      </div>
      <div class="credits-labels">
        <span>Used: ${Math.round(credits.usedPercentage)}%</span>
        <span>Remaining: ${remaining}%</span>
      </div>
    </section>
  `;
}

function getHealthColor(percent: number): string {
  if (percent <= 10) return '#f85149';
  if (percent <= 25) return '#d29922';
  if (percent <= 50) return '#d29922';
  return '#3fb950';
}
