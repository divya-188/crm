# Implementation Plan

This implementation plan breaks down the WhatsApp CRM SaaS platform development into discrete, manageable tasks. Each task builds incrementally on previous work, following a backend-first approach with frontend integration.

## Phase 1: Project Setup and Core Infrastructure

- [x] 1. Initialize project structure and development environment
  - Set up monorepo with backend and frontend directories
  - Initialize NestJS backend with TypeScript
  - Initialize React frontend with Vite and TypeScript
  - Configure ESLint, Prettier, and Git hooks
  - Set up Docker Compose (PostgreSQL, Redis, app)
  - Create .env.example files
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 2. Configure database and ORM setup
  - Install TypeORM or Prisma with PostgreSQL
  - Create database connection module with pooling
  - Set up migration system
  - Create seed scripts for initial data
  - Implement database health check endpoint
  - _Requirements: 13.1, 13.6_

- [x] 3. Set up Redis caching and session management
  - Install and configure Redis client
  - Create Redis service wrapper
  - Implement caching decorator
  - Set up session store using Redis
  - Create cache invalidation utilities
  - _Requirements: 13.3, 13.7_

- [x] 4. Implement authentication system
  - Create User entity with role-based fields
  - Implement JWT authentication with Passport.js
  - Create auth module with login, register, logout
  - Implement refresh token mechanism
  - Create password hashing utilities
  - Implement JWT guards and decorators
  - _Requirements: 1.1, 1.2, 12.3_

- [x] 5. Build multi-tenancy infrastructure
  - Create Tenant entity with settings
  - Implement tenant context middleware
  - Create tenant-aware repository base class
  - Implement tenant provisioning service
  - Add tenant validation guards
  - _Requirements: 1.1, 1.2, 1.3, 1.4_


## Phase 2: Core Data Models and API Foundation

- [x] 6. Create contact management system
  - Create Contact entity with custom fields (JSONB)
  - Implement contact CRUD API with pagination
  - Create contact import service for CSV files
  - Implement contact tagging system
  - Create contact segmentation query builder
  - Build contact search with indexing
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 21.1_

- [x] 7. Build conversation and message models
  - Create Conversation entity with status fields
  - Create Message entity for multiple media types
  - Implement conversation CRUD endpoints
  - Create message sending endpoint
  - Implement conversation assignment logic
  - Add conversation tagging
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 22.1_

- [x] 8. Implement WhatsApp connection management
  - Create WhatsAppConnection entity
  - Implement Meta WhatsApp Business API client
  - Integrate Baileys library for QR connections
  - Create QR code generation endpoint
  - Implement session persistence
  - Build connection health monitoring
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Build webhook receiver for incoming messages
  - Create webhook endpoint for Meta API
  - Implement webhook signature verification
  - Create message parser for different types
  - Implement contact auto-creation
  - Create conversation auto-creation
  - Add webhook event logging
  - _Requirements: 3.1, 3.2, 7.4, 11.3_

- [x] 10. Implement WebSocket gateway for real-time
  - Set up Socket.io with JWT authentication
  - Create inbox gateway for events
  - Implement room-based messaging
  - Create typing indicator events
  - Implement agent status broadcasting
  - Add connection management
  - _Requirements: 3.1, 3.2, 3.3_

## Phase 3: Template and Campaign System

- [x] 11. Create WhatsApp template management
  - Create Template entity with approval status
  - Implement template CRUD endpoints
  - Build template preview generation
  - Create Meta API integration for submission
  - Implement approval status polling
  - Add template variable validation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 24.1_

- [x] 12. Build campaign management system
  - Create Campaign entity with scheduling
  - Implement campaign CRUD endpoints
  - Create segment builder for filtering
  - Build campaign scheduling service
  - Implement campaign validation
  - Add campaign status tracking
  - _Requirements: 4.1, 4.2, 4.4, 18.1_

- [ ] 13. Implement campaign execution worker
  - Set up BullMQ queue for campaigns
  - Create campaign worker for sending
  - Implement rate limiting for Meta API
  - Build retry logic for failures
  - Create progress tracking
  - Implement pause and resume
  - _Requirements: 4.3, 4.6, 18.4_

## Phase 4: Chatbot Flow Builder Backend

- [x] 14. Create flow data models and storage
  - Create Flow entity with React Flow JSON
  - Implement flow CRUD endpoints
  - Create flow versioning
  - Build flow validation service
  - Implement flow trigger configuration
  - Add flow execution tracking entity
  - _Requirements: 2.1, 2.4, 2.7, 26.1_

- [x] 15. Build chatbot execution engine
  - Create flow execution service
  - Implement node type handlers
  - Build context management
  - Create flow navigation logic
  - Implement execution state persistence
  - Add error handling
  - _Requirements: 2.2, 2.3, 2.6, 15.3_

- [x] 16. Implement chatbot trigger system
  - Create trigger matching service
  - Implement keyword trigger detection
  - Build welcome message trigger
  - Create manual flow trigger endpoint
  - Implement trigger priority
  - Add trigger analytics
  - _Requirements: 2.1, 15.1, 15.2_

- [x] 17. Build advanced flow nodes
  - Implement API request node
  - Create Google Sheets integration node
  - Build webhook trigger node
  - Implement contact field update node
  - Create conversation assignment node
  - Add tag management node
  - _Requirements: 2.2, 2.5, 19.1_

## Phase 5: Automation and Workflow System

- [x] 18. Create automation rule engine
  - Create Automation entity
  - Implement automation CRUD endpoints
  - Build trigger detection service
  - Create condition evaluation engine
  - Implement action execution service
  - Add automation execution logging
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 19. Implement scheduled automation
  - Set up cron job scheduler
  - Create time-based trigger evaluation
  - Implement recurring automation
  - Build automation scheduling queue
  - Add timezone-aware scheduling
  - _Requirements: 15.4, 29.6_

## Phase 6: Analytics and Reporting

- [x] 20. Build analytics data aggregation
  - Create analytics service
  - Implement conversation analytics
  - Build message volume tracking
  - Create agent performance metrics
  - Implement campaign performance
  - Add flow performance tracking
  - _Requirements: 9.1, 9.2, 9.3, 26.1_

- [x] 21. Create analytics API endpoints
  - Implement dashboard metrics endpoint
  - Create conversation analytics endpoint
  - Build campaign performance endpoint
  - Implement agent performance endpoint
  - Create flow analytics endpoint
  - Add trend comparison endpoints
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 22. Implement report export functionality
  - Create CSV export service
  - Implement PDF report generation
  - Build scheduled report delivery
  - Add custom date range support
  - _Requirements: 9.5, 9.6_

## Phase 7: Subscription and Payment System

- [x] 23. Create subscription plan management
  - Create SubscriptionPlan entity
  - Implement plan CRUD endpoints
  - Create plan comparison endpoint
  - Build plan feature checking
  - Implement quota enforcement
  - _Requirements: 10.1, 10.3, 1.3_

- [x] 24. Integrate payment gateways
  - Integrate Stripe payment
  - Integrate PayPal payment
  - Integrate Razorpay payment
  - Create unified payment service
  - Implement webhook handlers
  - Build invoice generation
  - _Requirements: 10.2, 10.6_

- [x] 25. Implement subscription lifecycle
  - Create subscription on payment
  - Implement subscription renewal
  - Build expiration handling
  - Create downgrade/upgrade service
  - Implement payment reminders
  - Add coupon code support
  - _Requirements: 10.3, 10.4, 10.5_

## Phase 8: API and Webhook System

- [x] 26. Build public REST API
  - Create API key generation
  - Implement API key authentication
  - Build rate limiting per key
  - Create public API endpoints
  - Generate OpenAPI documentation
  - Add API usage tracking
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 27. Implement webhook management system
  - Create Webhook entity
  - Implement webhook CRUD endpoints
  - Build webhook delivery service
  - Create webhook signature generation
  - Implement webhook testing endpoint
  - Add webhook delivery logging
  - _Requirements: 6.5, 27.1, 27.2, 27.3_

## Phase 9: Frontend Foundation and Design System

- [x] 28. Set up frontend project and routing
  - Initialize React with Vite
  - Install TailAdmin template
  - Set up React Router
  - Create layout components
  - Implement role-based route protection
  - Configure Tailwind with custom colors
  - _Requirements: 2.1, 8.2, 30.1_

- [x] 29. Build design system and UI components
  - Create custom Tailwind theme
  - Build reusable UI components
  - Implement Framer Motion variants
  - Create loading states
  - Build toast notification system
  - Add icon library integration
  - _Requirements: 2.1, 13.4_

- [x] 30. Implement authentication UI
  - Create login page
  - Build registration page
  - Implement forgot password flow
  - Create password reset page
  - Build auth state management
  - Implement token refresh logic
  - _Requirements: 12.3_

- [x] 31. Set up API client and state management
  - Configure Axios with interceptors
  - Create API client service
  - Set up TanStack Query
  - Implement Zustand stores
  - Create Socket.io client wrapper
  - Build error handling
  - _Requirements: 6.1, 6.4_

## Phase 10: Inbox and Messaging UI

- [x] 32. Build inbox conversation list
  - Create conversation list component
  - Implement conversation filters
  - Build conversation search
  - Add unread count badges
  - Implement conversation selection
  - Create empty state
  - _Requirements: 3.1, 3.2, 22.1_

- [x] 33. Create conversation view and message display
  - Build message list with virtual scrolling
  - Create message bubble components
  - Implement message status indicators
  - Add typing indicators
  - Build conversation header
  - Create message timestamp formatting
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 34. Implement message input and sending
  - Create message input component
  - Build media upload functionality
  - Implement emoji picker
  - Add saved responses dropdown
  - Create message sending with optimistic updates
  - Build file preview
  - _Requirements: 3.2, 17.1, 17.2_

- [x] 35. Add conversation management features
  - Implement conversation assignment
  - Create tag management UI
  - Build internal notes functionality
  - Add conversation status controls
  - Implement bulk actions
  - Create conversation transfer modal
  - _Requirements: 3.4, 3.5, 22.1, 25.1_

## Phase 11: Contact Management UI

- [x] 36. Create contact list and management
  - Build contact list page
  - Implement contact search
  - Create contact detail view
  - Build contact creation forms
  - Implement contact import UI
  - Add contact export functionality
  - _Requirements: 11.1, 11.2, 11.3, 28.1_

- [x] 37. Implement contact segmentation UI
  - Create segment builder
  - Build segment preview
  - Implement saved segments list
  - Add segment editing
  - Create segment-based filtering
  - _Requirements: 11.5, 21.1, 21.2_

- [x] 38. Build custom fields management
  - Create custom field definition UI
  - Implement custom field types
  - Build custom field value editing
  - Add custom field filtering
  - _Requirements: 28.1, 28.2, 28.3_

## Phase 12: Flow Builder UI with React Flow

- [x] 39. Set up React Flow canvas
  - Install React Flow library
  - Create flow builder page
  - Implement zoom and pan controls
  - Build minimap
  - Add background grid styling
  - Create flow toolbar
  - _Requirements: 2.1, 2.4, 2.7_

- [x] 40. Build node palette with drag and drop
  - Create node palette sidebar
  - Implement drag and drop
  - Build node type definitions
  - Add node icons
  - Create collapsible categories
  - Implement node search
  - _Requirements: 2.1_

- [x] 41. Create custom node components with animations
  - Build custom node components
  - Implement node selection
  - Add node hover effects
  - Create node configuration panels
  - Build node validation indicators
  - Implement node deletion
  - _Requirements: 2.1, 2.4_

- [x] 42. Implement node configuration modals
  - Create message node configuration
  - Build condition node configuration
  - Implement input node configuration
  - Create API node configuration
  - Build delay node configuration
  - Add variable picker
  - _Requirements: 2.2, 2.3, 2.5_

- [x] 43. Add flow execution visualization
  - Implement flow testing mode
  - Create execution path highlighting
  - Build step-by-step animation
  - Add execution logs panel
  - Implement variable inspection
  - Create execution replay
  - _Requirements: 2.7, 26.1, 26.2_

- [x] 44. Build flow management features
  - Create flow list page
  - Implement flow duplication
  - Build flow versioning UI
  - Add flow activation toggle
  - Create flow deletion
  - Implement flow analytics dashboard
  - _Requirements: 2.4, 2.7, 26.1_

## Phase 13: Template and Campaign UI

- [x] 45. Create template management interface
  - Build template list page
  - Create template creation form
  - Implement template variable management
  - Build template submission workflow
  - Add template approval tracking
  - Create template editing
  - _Requirements: 5.1, 5.2, 5.3, 24.1_

- [x] 46. Build campaign creation wizard
  - Create multi-step wizard
  - Implement template selection
  - Build audience segmentation
  - Add message personalization preview
  - Create scheduling step
  - Implement campaign review
  - _Requirements: 4.1, 4.2, 18.1_

- [x] 47. Implement campaign management
  - Create campaign list
  - Build campaign detail page
  - Implement pause/resume controls
  - Add campaign message list
  - Create campaign analytics charts
  - Build campaign duplication
  - _Requirements: 4.5, 4.7, 18.3_

## Phase 14: Automation UI

- [x] 48. Create automation rule builder
  - Build automation list page
  - Create automation wizard
  - Implement trigger selection UI
  - Build condition builder
  - Create action configuration UI
  - Add automation testing
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 49. Implement automation management
  - Create enable/disable toggle
  - Build execution logs viewer
  - Implement automation editing
  - Add automation duplication
  - Create automation deletion
  - _Requirements: 15.6_

## Phase 15: Analytics Dashboard

- [x] 50. Build main dashboard with metrics
  - Create dashboard layout
  - Implement real-time updates
  - Build conversation trend chart
  - Create message volume chart
  - Add top agents leaderboard
  - Implement status breakdown
  - _Requirements: 9.1, 9.7_

- [x] 51. Create detailed analytics pages
  - Build conversation analytics page
  - Create campaign analytics page
  - Implement agent performance page
  - Build flow analytics page
  - Add custom date range selector
  - Create export functionality
  - _Requirements: 9.2, 9.3, 9.4, 26.1_

## Phase 16: Admin Panel Features

- [x] 52. Build tenant management
  - Create tenant list page
  - Implement tenant detail view
  - Build tenant creation form
  - Add tenant status management
  - Create tenant settings editor
  - Implement tenant deletion
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 53. Create subscription plan management
  - Build plan list page
  - Create plan creation forms
  - Implement plan feature configuration
  - Add plan limits configuration
  - Create plan activation
  - Build plan comparison preview
  - _Requirements: 10.1, 10.7_

- [x] 54. Implement user and agent management
  - Create user list
  - Build user creation form
  - Implement user editing
  - Add user status management
  - Create agent team assignment
  - Build agent performance dashboard
  - _Requirements: 8.1, 8.2, 8.3_

## Phase 17: Settings and Configuration

- [x] 55. Build WhatsApp connection management UI
  - Create connection list page
  - Implement QR code connection flow
  - Build Meta API credential configuration
  - Add connection status monitoring
  - Create reconnection functionality
  - Implement connection deletion
  - _Requirements: 7.1, 7.2, 7.3, 23.1_

- [x] 56. Create webhook configuration UI
  - Build webhook list page
  - Create webhook creation form
  - Implement event subscription selection
  - Add webhook testing functionality
  - Build webhook logs viewer
  - Create webhook editing
  - _Requirements: 27.1, 27.2, 27.3_

- [x] 57. Implement API key management UI
  - Create API key list page
  - Build API key generation
  - Implement API key display
  - Add API key usage statistics
  - Create API key revocation
  - Build API documentation viewer
  - _Requirements: 6.1, 6.2, 6.6_

- [x] 58. Build general settings pages
  - Create profile settings page
  - Implement password change
  - Build notification preferences
  - Add timezone and language settings
  - Create business profile configuration
  - Implement branding customization
  - _Requirements: 23.1, 30.1, 30.2_

## Phase 18: Installation Wizard and Setup

- [ ] 59. Create installation wizard backend
  - Build installation status checker
  - Create database setup endpoint
  - Implement admin account creation
  - Build configuration file writer
  - Create installation completion marker
  - Add installation lock mechanism
  - _Requirements: 1.1, 1.2_

- [ ] 60. Build installation wizard UI
  - Create welcome screen
  - Implement requirements check
  - Build database configuration form
  - Create admin account setup
  - Implement site configuration
  - Add installation progress indicator
  - Create completion screen
  - _Requirements: 1.1, 1.2_

- [ ] 61. Implement auto-update system
  - Create version checker service
  - Build update download functionality
  - Implement database backup
  - Create migration runner
  - Build update UI in admin panel
  - Add rollback functionality
  - _Requirements: 12.7_

## Phase 19: Additional Features

- [ ] 62. Implement saved responses system
  - Create saved response entity
  - Build saved response CRUD endpoints
  - Implement shortcut-based insertion
  - Add response variable support
  - Create response sharing
  - Build response usage tracking
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 63. Build message scheduling
  - Create scheduled message entity
  - Implement message scheduling endpoint
  - Build scheduled message queue
  - Add scheduled message cancellation
  - Create scheduled message list UI
  - Implement timezone-aware scheduling
  - _Requirements: 29.1, 29.2, 29.3_

- [ ] 64. Implement chat widget for websites
  - Create embeddable widget JavaScript
  - Build widget customization options
  - Implement widget click tracking
  - Create widget analytics
  - Build widget configuration UI
  - Add widget preview
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 65. Build integration marketplace
  - Create integration entity
  - Implement OAuth 2.0 flow
  - Build pre-built integration templates
  - Create integration configuration UI
  - Add integration activity logging
  - Implement integration error handling
  - _Requirements: 19.1, 19.2, 19.3_

## Phase 20: Testing, Documentation, and Polish

- [ ] 66. Write comprehensive documentation
  - Create installation guide
  - Write user manual
  - Build API documentation
  - Create video tutorials
  - Write troubleshooting guide
  - Build FAQ section
  - _Requirements: All_

- [ ] 67. Create demo data and examples
  - Build demo data seeder
  - Create sample chatbot flows
  - Add example message templates
  - Create sample contacts
  - Build demo campaign examples
  - Implement demo data reset
  - _Requirements: All_

- [ ] 68. Implement security hardening
  - Add rate limiting to endpoints
  - Implement CSRF protection
  - Build input sanitization
  - Add SQL injection prevention
  - Implement XSS protection
  - Create security headers middleware
  - Build audit logging
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 69. Performance optimization
  - Implement database query optimization
  - Add Redis caching
  - Build database indexes
  - Implement lazy loading
  - Add image optimization
  - Create bundle size optimization
  - Implement virtual scrolling
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 70. Final testing and bug fixes
  - Perform end-to-end testing
  - Test on different browsers
  - Verify mobile responsiveness
  - Test installation wizard
  - Verify all API endpoints
  - Test WebSocket connections
  - Fix identified bugs
  - _Requirements: All_

- [ ] 71. Prepare for CodeCanyon submission
  - Create product description
  - Record demo video
  - Take screenshots
  - Prepare marketing assets
  - Create changelog document
  - Build license verification system
  - Package application
  - _Requirements: All_
