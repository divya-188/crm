# WhatsCRM - WhatsApp CRM SaaS Platform

A comprehensive WhatsApp CRM SaaS platform with advanced chatbot flow builder, multi-tenancy, campaign management, and real-time messaging capabilities.

## Features

- 🏢 **Multi-Tenant SaaS Architecture** - Complete data isolation per tenant
- 🤖 **Visual Chatbot Flow Builder** - Drag-and-drop interface with 15+ node types
- 💬 **Unified Inbox** - Real-time conversation management with advanced filtering
- 📢 **Campaign Management** - Bulk messaging with scheduling and personalization
- 📊 **Analytics & Reporting** - Comprehensive insights and performance metrics
- 🔌 **REST API & Webhooks** - Full API access for integrations
- 💳 **Subscription Management** - Stripe, PayPal, and Razorpay integration
- 🎨 **Modern UI** - Purple/cyan/amber theme with smooth animations
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🔒 **Enterprise Security** - AES-256 encryption, 2FA, audit logs

## Tech Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Queue**: BullMQ
- **WhatsApp**: Meta Business API + Baileys
- **Real-time**: Socket.io

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Template**: TailAdmin
- **Styling**: Tailwind CSS
- **Flow Builder**: React Flow
- **State**: Zustand + TanStack Query
- **Animations**: Framer Motion

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatscrm-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development environment**
   ```bash
   npm run docker:up
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs

### Environment Variables

Create `.env` files in both `backend` and `frontend` directories:

**Backend (.env)**
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=whatscrm
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
APP_URL=http://localhost:3000
APP_PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# WhatsApp (configure later)
META_APP_ID=
META_APP_SECRET=
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

## Project Structure

```
whatscrm-saas/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── common/         # Shared utilities
│   │   ├── config/         # Configuration
│   │   └── database/       # Database entities & migrations
│   └── package.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── features/      # Feature modules
│   │   ├── lib/           # Utilities
│   │   └── styles/        # Global styles
│   └── package.json
├── docker-compose.yml      # Docker services configuration
└── package.json           # Root package.json (monorepo)
```

## Development

### Available Scripts

```bash
# Start all services
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Run linting
npm run lint

# Format code
npm run format

# Docker commands
npm run docker:up      # Start Docker services
npm run docker:down    # Stop Docker services
npm run docker:logs    # View Docker logs
```

### Code Quality

- **ESLint**: Configured for TypeScript
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **Lint-staged**: Run linters on staged files

## Documentation

- [Installation Guide](./docs/installation.md)
- [User Manual](./docs/user-manual.md)
- [API Documentation](./docs/api.md)
- [Development Guide](./docs/development.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@whatscrm.com or join our community forum.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
