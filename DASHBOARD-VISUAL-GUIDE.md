# Dashboard Visual Guide

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Dashboard Header                             │
│  "Welcome to your WhatsApp CRM dashboard..."                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  📊 Conversations│ │   👥 Contacts    │ │  💬 Messages     │ │   ⏱️ Avg Time   │
│                  │ │                  │ │                  │ │                  │
│      1,234       │ │       856        │ │     5,678        │ │      5m 30s      │
│   +12.5% ↑      │ │    +8.3% ↑      │ │   +15.2% ↑      │ │    -2.1% ↓      │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘

┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐
│     Conversation Trend (30 days)    │ │     Message Volume (30 days)        │
│                                     │ │                                     │
│  📈 Line Chart                      │ │  📊 Bar Chart                       │
│     - Smooth curves                 │ │     - Rounded bars                  │
│     - Hover tooltips                │ │     - Color: Cyan                   │
│     - Color: Purple                 │ │     - Daily breakdown               │
│     - Date axis                     │ │     - Date axis                     │
│                                     │ │                                     │
└─────────────────────────────────────┘ └─────────────────────────────────────┘

┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐
│         Top Agents                  │ │     Conversation Status             │
│                                     │ │                                     │
│  🥇 1. John Doe                     │ │   🥧 Pie Chart                      │
│     125 conversations               │ │                                     │
│     95.2% resolution                │ │   Legend:                           │
│                                     │ │   🟣 Open: 45 (35%)                 │
│  🥈 2. Jane Smith                   │ │   🟡 Pending: 30 (23%)              │
│     98 conversations                │ │   🔵 Resolved: 40 (31%)             │
│     92.8% resolution                │ │   🔷 Closed: 15 (11%)               │
│                                     │ │                                     │
│  🥉 3. Bob Johnson                  │ │                                     │
│     87 conversations                │ │                                     │
│     90.1% resolution                │ │                                     │
│                                     │ │                                     │
└─────────────────────────────────────┘ └─────────────────────────────────────┘
```

## Component Breakdown

### 1. Metric Cards (Top Row)
```
┌─────────────────────────────┐
│  [Icon]          +12.5% ↑   │
│                             │
│       1,234                 │
│  Total Conversations        │
└─────────────────────────────┘
```
**Features:**
- Large icon in colored background
- Growth percentage (green for positive, red for negative)
- Large number display
- Descriptive label
- Hover effect: Scale up + shadow glow

### 2. Conversation Trend Chart
```
     │
 150 │     ╱╲
     │    ╱  ╲    ╱╲
 100 │   ╱    ╲  ╱  ╲
     │  ╱      ╲╱    ╲
  50 │ ╱              ╲
     │╱                ╲
   0 └─────────────────────
     Jan 1  Jan 15  Jan 30
```
**Features:**
- Smooth line chart
- Purple color (#8b5cf6)
- Grid lines for reference
- Date labels on X-axis
- Hover tooltips with exact values
- Responsive container

### 3. Message Volume Chart
```
     │
 200 │     ▓▓
     │     ▓▓  ▓▓
 150 │ ▓▓  ▓▓  ▓▓  ▓▓
     │ ▓▓  ▓▓  ▓▓  ▓▓
 100 │ ▓▓  ▓▓  ▓▓  ▓▓  ▓▓
     │ ▓▓  ▓▓  ▓▓  ▓▓  ▓▓
   0 └─────────────────────
     Jan 1  Jan 15  Jan 30
```
**Features:**
- Bar chart with rounded tops
- Cyan color (#06b6d4)
- Grid lines for reference
- Date labels on X-axis
- Hover tooltips with exact values
- Responsive container

### 4. Top Agents Leaderboard
```
┌─────────────────────────────────┐
│  [1]  John Doe                  │
│       125 conversations         │
│                      95.2%      │
│                      Resolution │
├─────────────────────────────────┤
│  [2]  Jane Smith                │
│       98 conversations          │
│                      92.8%      │
│                      Resolution │
├─────────────────────────────────┤
│  [3]  Bob Johnson               │
│       87 conversations          │
│                      90.1%      │
│                      Resolution │
└─────────────────────────────────┘
```
**Features:**
- Numbered ranking badges
- Agent name and avatar
- Conversations handled count
- Resolution rate percentage
- Hover effect: Background highlight
- Stagger animation on load

### 5. Status Breakdown
```
        ┌─────────────┐
        │             │
    ╱───┴───╲     Legend:
   │         │    🟣 Open (35%)
   │    ●    │    🟡 Pending (23%)
   │         │    🔵 Resolved (31%)
    ╲───┬───╱     🔷 Closed (11%)
        │
        └─────────────┘
```
**Features:**
- Donut chart (pie with inner radius)
- Color-coded segments
- Status legend with percentages
- Count and percentage display
- Hover tooltips
- Responsive layout

## Color Palette

### Primary Colors
- **Purple** (#8b5cf6): Primary actions, conversations
- **Cyan** (#06b6d4): Secondary actions, messages
- **Amber** (#f59e0b): Accent, warnings
- **Blue** (#3b82f6): Success, resolved

### Status Colors
- **Open**: Purple (#8b5cf6)
- **Pending**: Yellow (#eab308)
- **Resolved**: Blue (#3b82f6)
- **Closed**: Cyan (#06b6d4)

### Semantic Colors
- **Success**: Blue (#3b82f6) - Positive growth
- **Danger**: Rose (#f43f5e) - Negative growth
- **Neutral**: Slate (#64748b) - Text and borders

## Animations

### Page Load
```
Initial State:     Final State:
  opacity: 0         opacity: 1
  y: 20px           y: 0px
  
Duration: 300ms
Easing: ease-out
```

### Card Hover
```
Rest State:        Hover State:
  scale: 1.0         scale: 1.02
  shadow: soft       shadow: glow
  
Duration: 300ms
Easing: ease-out
```

### List Items
```
Item 1: delay 0ms
Item 2: delay 100ms
Item 3: delay 200ms
Item 4: delay 300ms
Item 5: delay 400ms

Each item:
  opacity: 0 → 1
  x: -20px → 0px
```

## Responsive Behavior

### Desktop (lg: 1024px+)
- 4-column grid for metric cards
- 2-column grid for charts
- 2-column grid for bottom row
- Full chart heights (300px)

### Tablet (md: 768px+)
- 2-column grid for metric cards
- 2-column grid for charts
- 2-column grid for bottom row
- Reduced chart heights (250px)

### Mobile (< 768px)
- 1-column grid for all sections
- Stacked layout
- Full-width charts
- Compact chart heights (200px)
- Scrollable content

## Empty States

### No Data Available
```
┌─────────────────────────────┐
│                             │
│         [Icon]              │
│      (opacity: 50%)         │
│                             │
│   No data available         │
│                             │
└─────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────┐
│                             │
│         [Spinner]           │
│      (animated)             │
│                             │
│      Loading...             │
│                             │
└─────────────────────────────┘
```

### Error State
```
┌─────────────────────────────┐
│  ⚠️ Failed to load data     │
│                             │
│  [Retry Button]             │
└─────────────────────────────┘
```

## Real-time Updates

### WebSocket Events
```
Event: message:new
Action: Refresh dashboard metrics
Effect: Update all counters and charts

Event: conversation:updated
Action: Refresh dashboard metrics
Effect: Update status breakdown
```

### Update Flow
```
1. WebSocket event received
   ↓
2. Call loadMetrics()
   ↓
3. Fetch new data from API
   ↓
4. Update state
   ↓
5. Charts re-render with animation
   ↓
6. Counters update with transition
```

## Accessibility

### Keyboard Navigation
- All interactive elements are focusable
- Tab order follows visual layout
- Focus indicators visible

### Screen Readers
- Semantic HTML structure
- ARIA labels on charts
- Alt text for icons
- Descriptive labels

### Color Contrast
- All text meets WCAG AA standards
- Minimum 4.5:1 contrast ratio
- Color not sole indicator of meaning

## Performance

### Optimization Techniques
- Lazy loading of chart components
- Memoized calculations
- Debounced WebSocket updates
- Efficient re-renders
- Responsive chart containers

### Load Times
- Initial load: < 500ms
- Chart render: < 200ms
- Real-time update: < 100ms
- Smooth 60fps animations

## Browser Support

### Tested Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Features Used
- CSS Grid
- Flexbox
- CSS Custom Properties
- SVG (for charts)
- WebSocket API
- Framer Motion
