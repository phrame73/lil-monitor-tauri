# Lil Monitor 🖥️

A lightweight, cross-platform system monitoring tool built with **Tauri v2**, **React**, and **Rust**.

Designed to be fast, minimal, and beautiful.

![Dashboard Screenshot](https://via.placeholder.com/800x500?text=Lil+Monitor+Dashboard)
*(Add your screenshot here)*

## ✨ Features

- **Real-time Monitoring**:
  - **CPU**: Global usage with historical graph.
  - **Memory**: RAM usage with visual breakdown.
  - **Network**: Real-time upload/download speeds.
  - **Disk**: Usage status for all mounted drives.
- **Top Processes**: Live list of top 10 memory-consuming processes.
- **Cross-Platform**: Runs on Windows, Linux (Ubuntu, Arch, etc.), and macOS.
- **Tiny Footprint**: Native performance powered by Rust.

## 🚀 Installation

### Windows
Download the latest `.exe` installer from the [Releases](https://github.com/phrame73/lil-monitor-tauri/releases) page.

### Linux
Download the `.AppImage` from Releases.
```bash
chmod +x lil-monitor-tauri_*.AppImage
./lil-monitor-tauri_*.AppImage
```

**Note for Arch Linux Users:**
If you encounter rendering issues (white screen or crash), run with:
```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 ./lil-monitor-tauri_*.AppImage
```
*(This fix is already auto-applied in v0.1.4+, but good to know)*

## 🛠️ Development

### Prerequisites
- **Rust** (latest stable)
- **Node.js** (v18+)

### Setup
```bash
# Clone the repo
git clone https://github.com/phrame73/lil-monitor-tauri.git
cd lil-monitor-tauri

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build
```bash
npm run tauri build
```

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust + [sysinfo](https://crates.io/crates/sysinfo)
- **Framework**: [Tauri v2](https://v2.tauri.app/)

## 📄 License

MIT License