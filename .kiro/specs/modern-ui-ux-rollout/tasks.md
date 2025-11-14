# Implementation Plan

## Phase 1: Core Pages (High Priority)

- [x] 1. Update Contacts Page
  - Create ContactInlineForm component with all contact fields
  - Update Contacts page with stats cards, infinite scroll, and view toggle
  - Implement smooth scroll to forms
  - Add staggered animations for contact cards
  - Test all CRUD operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1_

- [x] 2. Update Templates Page
  - Create TemplateInlineForm component with template fields
  - Update Templates page with stats cards, infinite scroll, and view toggle
  - Implement template preview in cards
  - Add category and language filters
  - Test template creation and editing
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.2_

- [x] 3. Update Campaigns Page
  - Create CampaignInlineForm component with campaign fields
  - Update Campaigns page with stats cards, infinite scroll, and view toggle
  - Implement campaign status indicators
  - Add campaign type and status filters
  - Test campaign creation and scheduling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.3_

## Phase 2: Configuration Pages (Medium Priority)

- [x] 4. Update Automations Page
  - Create AutomationInlineForm component with automation fields
  - Update Automations page with stats cards, infinite scroll, and view toggle
  - Implement automation status indicators
  - Add trigger type and status filters
  - Test automation creation and activation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.4_

- [x] 5. Update Webhooks Page
  - Create WebhookInlineForm component with webhook fields
  - Update Webhooks page with stats cards, infinite scroll, and view toggle
  - Implement webhook status and health indicators
  - Add event type and status filters
  - Test webhook creation and testing
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.5_

- [x] 6. Update API Keys Page
  - Create ApiKeyInlineForm component with API key fields
  - Update API Keys page with stats cards, infinite scroll, and view toggle
  - Implement API key status and usage indicators
  - Add scope and status filters
  - Test API key creation and revocation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.6_

## Phase 3: Admin Pages (Lower Priority)

- [x] 7. Update WhatsApp Connections Page
  - Create ConnectionInlineForm component with connection fields
  - Update WhatsApp Connections page with stats cards, infinite scroll, and view toggle
  - Implement connection status and health indicators
  - Add status and type filters
  - Test connection creation and QR code scanning
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.7_

- [x] 8. Update Subscription Plans Page
  - Create PlanInlineForm component with plan fields
  - Update Subscription Plans page with stats cards, infinite scroll, and view toggle
  - Implement plan features and pricing display
  - Add plan type and status filters
  - Test plan creation and feature management
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.8_

## Shared Components & Utilities

- [x] 9. Create Reusable Components
- [x] 9.1 Create StatsCard component
  - Build reusable stats card with gradient icon
  - Support different colors and sizes
  - Add staggered animation support
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9.2 Create ViewToggle component
  - Build grid/list toggle control
  - Add active state styling
  - Support keyboard navigation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9.3 Create InfiniteScrollIndicator component
  - Build loading indicator for infinite scroll
  - Show different states (loading, no more, error)
  - Add smooth animations
  - _Requirements: 3.3, 3.4, 9.2_

- [x] 9.4 Create EmptyState component
  - Build reusable empty state with icon
  - Support custom messages and actions
  - Add fade-in animation
  - _Requirements: 1.5, 9.1_



## Backend Updates (If Needed)

- [x] 10. Add Pagination Support to Services
- [x] 10.1 Update contacts service for pagination
  - Add page and limit parameters
  - Return total count and hasMore flag
  - Optimize database queries
  - _Requirements: 3.1, 3.2_

- [ ] 10.2 Update templates service for pagination
  - Add page and limit parameters
  - Return total count and hasMore flag
  - Optimize database queries
  - _Requirements: 3.1, 3.2_

- [x] 10.3 Update campaigns service for pagination
  - Add page and limit parameters
  - Return total count and hasMore flag
  - Optimize database queries
  - _Requirements: 3.1, 3.2_

- [x] 10.4 Update automations service for pagination
  - Add page and limit parameters
  - Return total count and hasMore flag
  - Optimize database queries
  - _Requirements: 3.1, 3.2_

- [x] 10.5 Update webhooks service for pagination
  - Add page and limit parameters
  - Return total count and hasMore flag
  - Optimize database queries
  - _Requirements: 3.1, 3.2_

- [x] 10.6 Update API keys service for pagination
  - Add page and limit parameters
  - Return total count and hasMore flag
  - Optimize database queries
  - _Requirements: 3.1, 3.2_

- [x] 10.7 Update WhatsApp connections service for pagination
  - Add page and limit parameters
  - Return total count and hasMore flag
  - Optimize database queries
  - _Requirements: 3.1, 3.2_

- [x] 10.8 Update subscription plans service for pagination
  - Add page and limit parameters
  - Return total count and hasMore flag
  - Optimize database queries
  - _Requirements: 3.1, 3.2_



## Notes

- Each page update should follow the same pattern established in Tenants and Users pages
- Inline forms should replace existing modal forms
- All pages should support both grid and list views
- Stats cards should show relevant metrics for each page type
- Infinite scroll should load 20 items per page
- All animations should be smooth and performant
- Dark mode should be fully supported
- Mobile responsiveness is critical
- Accessibility must be maintained throughout
