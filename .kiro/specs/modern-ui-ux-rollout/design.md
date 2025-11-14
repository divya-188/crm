# Design Document

## Overview

This document provides the technical design for implementing a modern, consistent UI/UX pattern across all pages in the WhatsApp CRM application. The design is based on the successful implementation in the Tenants and Users pages and will be systematically applied to all remaining list-based pages.

## Architecture

### Component Hierarchy

```
Page Component
├── Header Section
│   ├── Title & Description
│   └── Primary Action Button
├── Stats Cards Grid (4 cards)
│   ├── Total Count Card
│   ├── Active/Success Card
│   ├── Inactive/Pending Card
│   └── Error/Suspended Card
├── Filter Card
│   ├── Search Input
│   ├── Filter Dropdowns
│   └── View Toggle (Grid/List)
├── Inline Form (Conditional)
│   ├── Create Form
│   └── Edit Form
├── Content Grid/List
│   ├── Item Cards (Grid View)
│   └── Item Rows (List View)
└── Infinite Scroll Indicator
```

### State Management

Each modernized page will use the following state structure:

```typescript
interface PageState {
  // View state
  viewMode: 'grid' | 'list';
  
  // Filter state
  filters: {
    search: string;
    status?: string;
    category?: string;
    // ... page-specific filters
  };
  
  // Form state
  showCreateForm: boolean;
  showEditForm: boolean;
  selectedItem: Item | null;
  
  // Modal state (for detail/delete modals)
  isDetailModalOpen: boolean;
  isDeleteModalOpen: boolean;
  
  // Dropdown state
  openDropdown: string | null;
}
```

### Data Fetching Pattern

All pages will use React Query's `useInfiniteQuery` for data fetching:

```typescript
const {
  data,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['items', filters],
  queryFn: ({ pageParam = 1 }) =>
    service.getItems({
      page: pageParam,
      limit: 20,
      ...filters,
    }),
  getNextPageParam: (lastPage) => {
    const nextPage = lastPage.page + 1;
    return nextPage <= Math.ceil(lastPage.total / lastPage.limit) 
      ? nextPage 
      : undefined;
  },
  initialPageParam: 1,
});
```

## Components and Interfaces

### 1. Stats Card Component

**Purpose:** Display key metrics with consistent styling

**Props:**
```typescript
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  delay?: number; // for staggered animation
}
```

**Design:**
- Gradient icon background (12x12 rounded-xl)
- Large bold value (text-3xl)
- Small label text (text-sm)
- Hover shadow effect
- Staggered fade-in animation

### 2. Inline Form Component

**Purpose:** Replace modal forms with inline page forms

**Props:**
```typescript
interface InlineFormProps {
  mode: 'create' | 'edit';
  item?: Item | null;
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Design:**
- Full-width card with primary border (border-2 border-primary-200)
- Gradient icon header (14x14 rounded-xl)
- Sectioned form fields with icons
- Sticky action buttons at bottom
- Fade + slide animation (opacity + translateY)

### 3. View Toggle Component

**Purpose:** Switch between grid and list views

**Design:**
```typescript
<div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
  <button className={viewMode === 'grid' ? 'active' : ''}>
    <Grid3x3 />
  </button>
  <button className={viewMode === 'list' ? 'active' : ''}>
    <List />
  </button>
</div>
```

### 4. Item Card Component (Grid View)

**Design Elements:**
- Gradient icon with status dot indicator
- Hover effects (translateY -4px, shadow-xl)
- Action dropdown (top-right)
- Stats section (if applicable)
- Footer with metadata
- Border highlight on hover (border-primary-200)

### 5. Item Row Component (List View)

**Design Elements:**
- Horizontal layout with icon on left
- Compact information display
- Inline stats (hidden on mobile)
- Action dropdown on right
- Hover shadow effect

## Data Models

### Generic Item Interface

```typescript
interface BaseItem {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

### Page-Specific Extensions

Each page will extend the base interface with specific fields:

```typescript
// Contacts
interface Contact extends BaseItem {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  tags?: string[];
}

// Templates
interface Template extends BaseItem {
  category: string;
  language: string;
  content: string;
}

// Campaigns
interface Campaign extends BaseItem {
  type: string;
  scheduledAt?: string;
  sentCount: number;
  deliveredCount: number;
}

// ... etc for other pages
```

## Error Handling

### Error States

1. **Initial Load Error:**
   - Display error card with icon
   - Show error message
   - Provide retry button

2. **Infinite Scroll Error:**
   - Show toast notification
   - Stop fetching more pages
   - Display last successful page

3. **Form Submission Error:**
   - Show toast notification
   - Keep form open with data
   - Highlight error fields

4. **Network Error:**
   - Show offline indicator
   - Queue actions for retry
   - Restore when online

### Error Recovery

```typescript
const handleError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  if (error.message.includes('network')) {
    toast.error('Network error. Please check your connection.');
  } else if (error.message.includes('unauthorized')) {
    toast.error('Session expired. Please log in again.');
    // Redirect to login
  } else {
    toast.error(`Failed to ${context}. Please try again.`);
  }
};
```

## Testing Strategy

### Unit Tests

1. **Component Rendering:**
   - Stats cards display correct values
   - Inline forms populate with edit data
   - View toggle switches layouts
   - Item cards render all fields

2. **User Interactions:**
   - Search input triggers query
   - Filter changes update results
   - Form submission calls API
   - Delete confirmation works

3. **State Management:**
   - View mode persists
   - Filters apply correctly
   - Form state resets on cancel
   - Selected item updates

### Integration Tests

1. **Data Flow:**
   - Infinite scroll loads pages
   - Create form adds items
   - Edit form updates items
   - Delete removes items

2. **Error Scenarios:**
   - API errors show messages
   - Network errors handled
   - Validation errors displayed
   - Recovery actions work

### Visual Regression Tests

1. **Layout:**
   - Grid view responsive
   - List view responsive
   - Forms display correctly
   - Animations smooth

2. **Theming:**
   - Dark mode works
   - Colors consistent
   - Gradients render
   - Icons display

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:**
   - Use React.lazy for heavy components
   - Load modals on demand
   - Defer non-critical animations

2. **Memoization:**
   - Memo expensive calculations
   - Use useMemo for filtered data
   - Memo card components

3. **Virtualization:**
   - Consider react-window for very long lists
   - Implement if > 1000 items
   - Maintain scroll position

4. **Query Optimization:**
   - Cache query results
   - Prefetch next page
   - Invalidate selectively

### Performance Metrics

- Initial page load: < 2s
- Infinite scroll trigger: < 500ms
- Form submission: < 1s
- View mode switch: < 100ms
- Animation frame rate: 60fps

## Accessibility

### ARIA Labels

```typescript
// Stats cards
<div role="region" aria-label="Statistics">
  <div role="status" aria-live="polite">
    {value} {title}
  </div>
</div>

// Inline forms
<form aria-label={`${mode} ${itemType} form`}>
  <button aria-label="Cancel form">Cancel</button>
  <button aria-label={`${mode} ${itemType}`}>Submit</button>
</form>

// View toggle
<div role="group" aria-label="View mode">
  <button aria-label="Grid view" aria-pressed={viewMode === 'grid'}>
  <button aria-label="List view" aria-pressed={viewMode === 'list'}>
</div>
```

### Keyboard Navigation

- Tab through all interactive elements
- Enter to submit forms
- Escape to close forms/modals
- Arrow keys for dropdowns
- Space to toggle checkboxes

### Screen Reader Support

- Announce loading states
- Announce form errors
- Announce success messages
- Describe icon meanings
- Label all inputs

## Implementation Phases

### Phase 1: Core Pages (High Priority)
1. Contacts - Most used, complex filters
2. Templates - Frequently accessed
3. Campaigns - Important for marketing

### Phase 2: Configuration Pages (Medium Priority)
4. Automations - Complex UI
5. Webhooks - Technical users
6. API Keys - Developer focused

### Phase 3: Admin Pages (Lower Priority)
7. WhatsApp Connections - Admin only
8. Subscription Plans - Super admin only

### Rollout Strategy

For each page:
1. Create inline form component
2. Update page component with new pattern
3. Add infinite scroll
4. Implement view toggle
5. Add stats cards
6. Test thoroughly
7. Deploy to staging
8. Get user feedback
9. Deploy to production

## Design Decisions

### Why Inline Forms Over Modals?

**Rationale:**
- Better context - users see the list while editing
- Smoother UX - no modal interruption
- Easier navigation - smooth scroll to form
- More space - can use full page width
- Better mobile - no modal overlay issues

### Why Infinite Scroll Over Pagination?

**Rationale:**
- Modern UX pattern - users expect it
- Faster browsing - no page clicks
- Better mobile - natural scrolling
- Maintains context - no page reloads
- Progressive loading - better perceived performance

### Why Grid/List Toggle?

**Rationale:**
- User preference - different workflows
- Density control - more/less info
- Responsive - grid for desktop, list for mobile
- Flexibility - adapt to content type
- Industry standard - common pattern

## Visual Design System

### Color Palette

```typescript
const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... through 900
  },
  success: {
    50: '#f0fdf4',
    // ... green shades
  },
  warning: {
    50: '#fffbeb',
    // ... yellow shades
  },
  danger: {
    50: '#fef2f2',
    // ... red shades
  },
  neutral: {
    50: '#fafafa',
    // ... gray shades
  },
};
```

### Typography Scale

- Heading 1: text-3xl font-bold (30px)
- Heading 2: text-2xl font-bold (24px)
- Heading 3: text-xl font-semibold (20px)
- Body: text-base (16px)
- Small: text-sm (14px)
- Tiny: text-xs (12px)

### Spacing Scale

- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Border Radius

- sm: 0.375rem (6px)
- md: 0.5rem (8px)
- lg: 0.75rem (12px)
- xl: 1rem (16px)
- 2xl: 1.5rem (24px)
- full: 9999px

### Shadow Scale

- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.1)
- lg: 0 10px 15px rgba(0,0,0,0.1)
- xl: 0 20px 25px rgba(0,0,0,0.1)

## Animation Specifications

### Timing Functions

```typescript
const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};
```

### Animation Variants

```typescript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Android 90+

## Dependencies

### Required Libraries

- React 18+
- React Query (TanStack Query) 5+
- Framer Motion 10+
- Lucide React (icons)
- React Hot Toast (notifications)
- Tailwind CSS 3+

### Optional Enhancements

- react-window (virtualization)
- react-intersection-observer (scroll detection)
- date-fns (date formatting)

This design provides a comprehensive blueprint for implementing the modern UI/UX pattern across all pages while maintaining consistency, performance, and accessibility.
