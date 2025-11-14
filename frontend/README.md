# WhatsCRM Frontend

React-based frontend application for the WhatsApp CRM SaaS platform.

## Tech Stack

- **React 18+** with TypeScript
- **Vite** for fast development and building
- **React Router v6** for routing
- **Tailwind CSS** for styling with custom design system
- **Zustand** for state management
- **TanStack Query** for server state management
- **Framer Motion** for animations
- **React Flow** for chatbot flow builder
- **Socket.io Client** for real-time communication
- **Axios** for API requests

## Project Structure

```
src/
├── components/
│   ├── layouts/          # Layout components (Auth, User, Admin, Agent)
│   ├── routes/           # Route protection components
│   └── ui/               # Reusable UI components
├── pages/                # Page components
│   ├── auth/            # Authentication pages
│   ├── admin/           # Admin panel pages
│   └── agent/           # Agent panel pages
├── lib/                  # Utilities and stores
│   ├── auth.store.ts    # Authentication state management
│   └── utils.ts         # Utility functions
├── types/                # TypeScript type definitions
├── routes/               # Route configuration
└── styles/               # Global styles

```

## Features Implemented

### Authentication & Authorization
- ✅ JWT-based authentication with Zustand persistence
- ✅ Protected routes with authentication check
- ✅ Role-based route protection (Admin, User, Agent)
- ✅ Public routes with auto-redirect for authenticated users
- ✅ Login and Registration pages

### Layouts
- ✅ **AuthLayout**: Clean authentication pages with branding
- ✅ **UserLayout**: Full-featured dashboard for business users
- ✅ **AdminLayout**: System administration interface
- ✅ **AgentLayout**: Simplified interface for support agents

### Navigation
- ✅ Collapsible sidebar with icons and badges
- ✅ Header with user menu and notifications
- ✅ Role-specific navigation items
- ✅ Active route highlighting

### Design System
- ✅ Custom Tailwind color palette
  - Primary: Deep Purple/Indigo
  - Secondary: Cyan/Teal
  - Accent: Amber/Orange
  - Success: Blue
  - Danger: Rose/Pink
  - Warning: Yellow
  - Neutral: Slate
- ✅ Custom animations (fade-in, slide-in, slide-up, scale-in, etc.)
- ✅ Shadow utilities (soft, glow)
- ✅ Custom font families (Inter, Poppins)

## Getting Started

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Routes

### Public Routes
- `/auth/login` - Login page
- `/auth/register` - Registration page

### User Routes (Role: user)
- `/dashboard` - User dashboard
- `/inbox` - Conversation inbox
- `/contacts` - Contact management
- `/campaigns` - Campaign management
- `/templates` - WhatsApp templates
- `/flows` - Chatbot flow builder
- `/automations` - Automation rules
- `/analytics` - Analytics dashboard
- `/whatsapp` - WhatsApp connections
- `/settings` - User settings

### Admin Routes (Role: admin)
- `/admin/dashboard` - Admin dashboard
- `/admin/tenants` - Tenant management
- `/admin/plans` - Subscription plans
- `/admin/users` - User management
- `/admin/analytics` - System analytics
- `/admin/security` - Security settings
- `/admin/settings` - System settings

### Agent Routes (Role: agent)
- `/agent/dashboard` - Agent dashboard
- `/agent/inbox` - Agent inbox
- `/agent/contacts` - Contact list
- `/agent/settings` - Agent settings

## State Management

### Auth Store (Zustand)

```typescript
import { useAuthStore } from '@/lib/auth.store';

// In your component
const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

// Login
setAuth(user, accessToken, refreshToken);

// Logout
clearAuth();
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

## Next Steps

The following features are ready to be implemented:

1. **API Integration**: Connect to backend API endpoints
2. **Real-time Updates**: Implement Socket.io for live updates
3. **Inbox UI**: Build conversation list and message components
4. **Flow Builder**: Implement React Flow-based chatbot builder
5. **Campaign Management**: Create campaign wizard and management UI
6. **Analytics Dashboard**: Build charts and metrics visualization
7. **Contact Management**: Implement contact list and segmentation
8. **Template Management**: Create template editor and approval tracking

## Development Guidelines

- Use TypeScript for all new files
- Follow the existing component structure
- Use Tailwind CSS classes for styling
- Implement responsive design (mobile-first)
- Add animations using Framer Motion
- Use Zustand for global state
- Use TanStack Query for server state
- Follow the established naming conventions

## Testing

```bash
npm run lint
```

## License

Proprietary - All rights reserved
