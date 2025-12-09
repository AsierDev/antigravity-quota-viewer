# ⚡ Antigravity Quota Viewer


[![Open VSX](https://img.shields.io/open-vsx/v/asierdev/antigravity-quota-viewer?color=purple&label=Open%20VSX)](https://open-vsx.org/extension/asierdev/antigravity-quota-viewer)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/asierdev.antigravity-quota-viewer?color=blue&label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=asierdev.antigravity-quota-viewer)
![License](https://img.shields.io/badge/license-MIT-green)

Comprehensive visualization of AI model quota status in Antigravity with predictive analysis and modern dashboard.

[🇪🇸 Versión en Español](#-versión-en-español)

## ✨ Features

- 📊 **Visual Dashboard** with modern glassmorphism design
- 🔮 **Quota Exhaustion Prediction** based on burn rate
- 📈 **Real-time Burn Rate Analysis** per model
- 🏥 **Overall Health Score** showing weighted average of all quotas
- 🎯 **Customizable Alerts** for low specific quotas
- 💳 **Prompt Credits Tracking** (available vs total)
- 📱 **Integrated Status Bar** with summary info
- 🔄 **Auto-refresh** via configurable polling

## 🚀 Installation

### From Marketplace

You can install the extension directly from your favorite marketplace:

- **Antigravity / Open VSX**: [Install from Open VSX](https://open-vsx.org/extension/asierdev/antigravity-quota-viewer)
- **VS Code Marketplace**: [Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=asierdev.antigravity-quota-viewer)

1. Open Antigravity IDE or VS Code
2. Go to Extensions (`Cmd+Shift+X`)
3. Search for "Antigravity Quota Viewer"
4. Click **Install**

### Manual Installation

1. Download the `.vsix` file from the [Releases](https://github.com/AsierDev/antigravity_cuota_viewer/releases) page.
2. Open Antigravity IDE
3. Extensions → `...` → **Install from VSIX**
4. Select the downloaded file

## 📖 Usage

### Available Commands

| Command | Description | Shortcut |
|---------|-------------|-------|
| `Quota Viewer: Open Dashboard` | Open full dashboard | - |
| `Quota Viewer: Quick Status` | Quick status view | - |
| `Quota Viewer: Refresh Now` | Manually refresh data | - |

### Quick Access

- **Status Bar**: Click on the quota indicator in the bottom bar
- **Command Palette**: `Cmd+Shift+P` → Search "Quota Viewer"

## ⚙️ Configuration

Open Settings (`Cmd+,`) and search for "Quota Viewer":

```json
{
  // Enable automatic monitoring
  "quotaViewer.enabled": true,
  
  // Polling interval in seconds (minimum 30s)
  "quotaViewer.pollingInterval": 120,
  
  // Models to show in status bar (IDs or labels)
  "quotaViewer.pinnedModels": [],
  
  // Alert threshold percentage (5-50%)
  "quotaViewer.alertThreshold": 20
}
```

## 📊 Dashboard Features

The dashboard displays:

- **Overall Health Score**: Weighted average of all quotas
- **Active Models Count**: Number of available models
- **Session Usage**: Usage since Antigravity started
- **Model Cards**: For each AI model:
  - Remaining percentage with circular visualization
  - Time until reset
  - Burn rate (consumption speed)
  - Predicted exhaustion ETA
  - Usage in current session
  - Active model badge

## 🔧 Development

### Requirements

- Node.js 20+
- npm 8+
- Antigravity IDE installed

### Local Setup

```bash
# Clone repository
git clone https://github.com/AsierDev/antigravity_cuota_viewer
cd antigravity_cuota_viewer

# Install dependencies
npm install

# Compile
npm run compile

# Run tests
npm test

# Coverage
npm run test:coverage

# Package extension
npm run package
```

### Testing in Antigravity

1. Open the project in Antigravity
2. Press `F5` to start debugging
3. The extension will be active in the new Antigravity window

## 🏗️ Architecture

```
src/
├── core/               # Core services
│   ├── processDetector.ts   # Antigravity process detection
│   ├── quotaService.ts       # Quota API client
│   └── platformStrategies.ts # Multi-platform strategies
├── insights/           # Analysis and predictions
│   └── insightsService.ts    # Burn rate and ETA calculation
├── ui/                 # UI Components
│   ├── statusBar.ts          # Status bar manager
│   └── dashboard/            # WebView dashboard
└── types/              # TypeScript definitions

out/                    # Compiled code
coverage/               # Coverage reports
```

## 🧪 Tests

- **84 unit tests** with Jest
- **40% global coverage** (core services >80%)
- Test suites:
  - `processDetector.test.ts`: Process detection
  - `quotaService.test.ts`: API calls
  - `insightsService.test.ts`: Data analysis

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add: amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Guidelines

- Keep tests passing
- Add tests for new features
- Follow project TypeScript conventions
- Document public functions with JSDoc

## 🐛 Issues

Report bugs or request features on [GitHub Issues](https://github.com/AsierDev/antigravity_cuota_viewer/issues)

## 📄 License

MIT © 2025

---

## 🙏 Acknowledgements

- Antigravity Team for the excellent IDE
- VS Code Community for the extensible APIs

---

**Made with ❤️ for the Antigravity community**

---

# ⚡ Antigravity Quota Viewer

[🇺🇸 English Version](#-antigravity-quota-viewer)


[![Open VSX](https://img.shields.io/open-vsx/v/asierdev/antigravity-quota-viewer?color=purple&label=Open%20VSX)](https://open-vsx.org/extension/asierdev/antigravity-quota-viewer)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/asierdev.antigravity-quota-viewer?color=blue&label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=asierdev.antigravity-quota-viewer)
![License](https://img.shields.io/badge/license-MIT-green)

Visualización exhaustiva del estado de cuotas de modelos AI en Antigravity con análisis predictivo y dashboard moderno.

## 🇪🇸 Versión en Español

## ✨ Features

- 📊 **Dashboard visual** con diseño glassmorphism moderno
- 🔮 **Predicción de agotamiento** de cuotas basada en burn rate
- 📈 **Análisis de burn rate** por modelo en tiempo real
- 🏥 **Overall Health Score** mostrando promedio ponderado de cuotas
- 🎯 **Alertas personalizables** cuando la cuota está baja
- 💳 **Seguimiento de Prompt Credits** disponibles
- 📱 **Status bar integrado** con información resumida
- 🔄 **Actualización automática** via polling configurable

## 🚀 Instalación

### Desde Marketplace

Puedes instalar la extensión directamente desde tu marketplace favorito:

- **Antigravity / Open VSX**: [Instalar desde Open VSX](https://open-vsx.org/extension/asierdev/antigravity-quota-viewer)
- **VS Code Marketplace**: [Instalar desde VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=asierdev.antigravity-quota-viewer)

1. Abrir Antigravity IDE o VS Code
2. Ir a Extensions (`Cmd+Shift+X`)
3. Buscar "Antigravity Quota Viewer"
4. Click en **Install**

### Instalación Manual

1. Descarga el archivo `.vsix` desde la página de [Releases](https://github.com/AsierDev/antigravity_cuota_viewer/releases).
2. Abrir Antigravity IDE
3. Extensions → `...` → **Install from VSIX**
4. Seleccionar el archivo descargado

## 📖 Uso

### Comandos Disponibles

| Comando | Descripción | Atajo |
|---------|-------------|-------|
| `Quota Viewer: Open Dashboard` | Abrir dashboard completo | - |
| `Quota Viewer: Quick Status` | Vista rápida de estado | - |
| `Quota Viewer: Refresh Now` | Actualizar datos manualmente | - |

### Acceso Rápido

- **Status Bar**: Click en el indicador de cuota en la barra inferior
- **Command Palette**: `Cmd+Shift+P` → Buscar "Quota Viewer"

## ⚙️ Configuración

Abre Settings (`Cmd+,`) y busca "Quota Viewer":

```json
{
  // Habilitar monitoreo automático
  "quotaViewer.enabled": true,
  
  // Intervalo de actualización en segundos (mínimo 30s)
  "quotaViewer.pollingInterval": 120,
  
  // Modelos a mostrar en status bar (IDs o labels)
  "quotaViewer.pinnedModels": [],
  
  // Umbral de alerta en porcentaje (5-50%)
  "quotaViewer.alertThreshold": 20
}
```

## 📊 Dashboard Features

El dashboard muestra:

- **Overall Health Score**: Promedio ponderado de todas las cuotas
- **Active Models Count**: Número de modelos disponibles
- **Session Usage**: Uso desde que iniciaste Antigravity
- **Model Cards**: Para cada modelo AI:
  - Porcentaje restante con visualización circular
  - Tiempo hasta el reset
  - Burn rate (velocidad de consumo)
  - ETA de agotamiento predicha
  - Uso en la sesión actual
  - Badge de modelo activo

## 🔧 Desarrollo

### Requisitos

- Node.js 20+
- npm 8+
- Antigravity IDE installed

### Setup Local

```bash
# Clonar repositorio
git clone https://github.com/asier/antigravity-quota-viewer
cd antigravity-quota-viewer

# Instalar dependencias
npm install

# Compilar
npm run compile

# Ejecutar tests
npm test

# Coverage
npm run test:coverage

# Empaquetar extensión
npm run package
```

### Testing en Antigravity

1. Abrir el proyecto en Antigravity
2. Presionar `F5` para iniciar debug
3. En la nueva ventana de Antigravity, la extensión estará activa

## 🏗️ Arquitectura

```
src/
├── core/               # Servicios principales
│   ├── processDetector.ts   # Detección del proceso Antigravity
│   ├── quotaService.ts       # Cliente API de cuotas
│   └── platformStrategies.ts # Estrategias multi-plataforma
├── insights/           # Análisis y predicciones
│   └── insightsService.ts    # Cálculo de burn rate y ETAs
├── ui/                 # Componentes de interfaz
│   ├── statusBar.ts          # Gestor de status bar
│   └── dashboard/            # WebView dashboard
└── types/              # Definiciones TypeScript

out/                    # Código compilado
coverage/               # Reportes de coverage
```

## 🧪 Tests

- **84 tests** unitarios con Jest
- **40% coverage** global (core services >80%)
- Test suites:
  - `processDetector.test.ts`: Detección de procesos
  - `quotaService.test.ts`: Llamadas API
  - `insightsService.test.ts`: Análisis de datos

```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Watch mode
npm run test:coverage # Con reporte de coverage
```

## 🤝 Contribuir

Las contribuciones son bienvenidas!

1. Fork el repositorio
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: amazing feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guidelines

- Mantener tests pasando
- Agregar tests para nuevas features
- Seguir convenciones TypeScript del proyecto
- Documentar funciones públicas con JSDoc

## 🐛 Issues

Reporta bugs o pide features en [GitHub Issues](https://github.com/asier/antigravity-quota-viewer/issues)

## 📄 License

MIT © 2025

---

## 🙏 Agradecimientos

- Antigravity Team por el excelente IDE
- Comunidad VS Code por las APIs extensibles

---

**Hecho con ❤️ para la comunidad de Antigravity**
