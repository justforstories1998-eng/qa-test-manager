# QA Test Manager

A comprehensive, production-ready Quality Assurance test management application built with React and Node.js. Features CSV imports from Azure DevOps, visual dashboards with charts, professional report generation (PDF/Word), and Grok AI-powered analytics.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Configuration](#-configuration)
- [Grok AI Integration](#-grok-ai-integration)
- [CSV Import Format](#-csv-import-format)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Test Case Management
- 📁 Organize test cases into test suites
- 📤 Import test cases from Azure DevOps (ADO) CSV exports
- ✏️ Create, edit, and delete test cases manually
- 🏷️ Support for priorities, tags, and automation status
- 🔍 Search and filter functionality

### Test Execution
- ▶️ Create and manage test runs
- ✅ Execute tests with Pass/Fail/Blocked/Not Run statuses
- 💬 Add comments and notes during execution
- 📊 Real-time progress tracking
- ⚡ Auto-advance and auto-save options

### Dashboard & Analytics
- 📈 Visual charts (Doughnut, Bar, Line)
- 📊 Pass rate trends over time
- 🎯 Priority distribution breakdown
- 📉 Status summary cards
- 🔄 Real-time statistics

### Report Generation
- 📄 Professional PDF reports with cover pages
- 📝 Word (DOCX) document export
- 🎨 Customizable report content
- 📊 Charts and metrics inclusion
- 🖨️ Print-ready formatting

### AI-Powered Analysis (Grok)
- 🤖 Executive summary generation
- ⚠️ Risk assessment and analysis
- 💡 Intelligent recommendations
- 🚀 Release readiness evaluation
- 📋 Key findings identification

### Settings & Configuration
- ⚙️ General application settings
- 🎮 Execution behavior options
- 📑 Report customization
- 🔔 Notification preferences
- 🎨 Display options

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Chart.js / react-chartjs-2** - Data visualization
- **Axios** - HTTP client
- **React Icons** - Icon library
- **React Toastify** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **LowDB** - Embedded JSON database
- **Multer** - File upload handling
- **PDFKit** - PDF generation
- **docx** - Word document generation
- **csv-parse** - CSV parsing

### AI Integration
- **Grok AI (xAI)** - Intelligent analysis

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **Git** (optional, for cloning)

Verify your installations:

```bash
node --version
npm --version