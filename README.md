
---
## 📁 System Architecture & Directory Structure
```text
learncurve/
│
├── Frontend/                             # Client-side Single Page Application
│   ├── public/                           # Static assets, branding & routing rules
│   │   ├── _redirects                    # Client-side SPA routing fallback
│   │   └── assets/                       # Brand logos, icons, illustrations
│   ├── src/
│   │   ├── api/                          # Unified HTTP client, token refresh & endpoints
│   │   │   └── client.js                 # Shared fetch wrapper with 401 retry handling
│   │   ├── Components/                   # Modular UI component library
│   │   │   ├── auth/                     # Authentication dialogs, OTP forms, OAuth triggers
│   │   │   ├── elements/                 # Reusable buttons, dropdowns, badges, glow lights
│   │   │   ├── landing/                  # Marketing hero, feature showcases, pricing, FAQ
│   │   │   ├── layout/                   # Global navbar, sidebar shell, sticky footers
│   │   │   └── room/                     # Room dashboard, Kanban board, AI editor, chat modal
│   │   ├── Pages/                        # Top-level view routes
│   │   │   ├── App/                      # Core app: Dashboard, Study Room, Duo Hub, Settings
│   │   │   └── Static/                   # Landing, Documentation, Terms, Privacy, 404
│   │   ├── sockets/                      # Real-time Socket.IO client instance and event hooks
│   │   │   ├── socketClient.js           # Multi-transport socket connector with auto-reconnect
│   │   │   └── useRoomSocket.js          # Room lifecycle listeners and state dispatchers
│   │   ├── utils/                        # Formatting, chat reconciliation, storage adapters
│   │   ├── App.jsx                       # Master router configuration
│   │   ├── main.jsx                      # Client bootstrap & context providers
│   │   └── index.css                     # Design tokens, theme variables & Tailwind directives
│   ├── index.html                        # Application entry HTML
│   └── vite.config.js                    # Vite bundler plugins and proxy settings
│
└── Backend/                              # Server-side API & Real-Time Engine
    ├── src/
    │   ├── config/                       # Runtime config, Supabase client, MongoDB connector
    │   ├── controllers/                  # Core domain logic
    │   │   ├── aiController.ts           # Roadmap synthesis, module tuning, test generation
    │   │   ├── authController.ts         # User registration, direct Google OAuth, password reset
    │   │   ├── chatController.ts         # Room messages, rate limiting, attachment validation
    │   │   ├── duoController.ts          # Study partner pairing, invites, mutual streaks
    │   │   ├── kanbanController.ts       # Board status, card movements, adaptive re-planning
    │   │   ├── roomController.ts         # Room lifecycle, member capacity locks, discovery
    │   │   └── userController.ts         # Profile data, avatar uploads, CV documents
    │   ├── middlewares/                  # Auth verification, rate limiting, error handling
    │   ├── models/                       # Mongoose schemas (Roadmap, Quiz, Kanban, Chat)
    │   ├── routes/                       # Express router definitions (/api/*)
    │   ├── services/                     # Core business services
    │   │   ├── aiService.ts              # Groq dual-key failover & prompt templates
    │   │   ├── db.ts                     # Supabase PostgreSQL abstraction with memDb fallback
    │   │   ├── roadmapPlanner.ts         # Two-stage curriculum synthesis & budget scaling
    │   │   └── storage.ts                # Avatar & document streaming to Supabase buckets
    │   ├── sockets/                      # Socket.IO handlers, presence tracking & event routes
    │   ├── types/                        # TypeScript interfaces and contracts
    │   ├── utils/                        # Study budget math, JWT signing, dayKey normalization
    │   ├── app.ts                        # Express pipeline setup, security headers, CORS
    │   └── server.ts                     # HTTP server startup & WebSocket attachment
    ├── supabase/                         # PostgreSQL schema definitions & migrations
    │   ├── migrations/                   # Incremental SQL migrations (0001 - 0008)
    │   └── ALL_MIGRATIONS.sql            # Compiled migration bundle with integrity checks
    ├── scripts/                          # Migration linters, storage verifiers, test purgers
    ├── tests/                            # Vitest automated test suites
    └── tsconfig.json                     # Strict TypeScript compiler options
```
