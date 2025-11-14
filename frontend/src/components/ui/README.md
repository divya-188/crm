# UI Component Library

A comprehensive design system built with React, TypeScript, Tailwind CSS, and Framer Motion for the WhatsApp CRM SaaS platform.

## Overview

This design system provides a complete set of reusable UI components with:
- **Consistent styling** using Tailwind CSS custom theme
- **Smooth animations** powered by Framer Motion
- **Accessibility** built-in with proper ARIA attributes
- **TypeScript** support with full type definitions
- **Responsive design** that works on all screen sizes

## Components

### Form Components

#### Button
Versatile button component with multiple variants and states.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `icon`: React.ReactNode
- `iconPosition`: 'left' | 'right'
- `fullWidth`: boolean

#### Input
Text input with label, error states, and icon support.

```tsx
import { Input } from '@/components/ui';
import { Icons } from '@/lib/icons';

<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  icon={<Icons.mail size={18} />}
  error="Invalid email"
/>
```

#### Select
Dropdown select component with custom styling.

```tsx
import { Select } from '@/components/ui';

<Select
  label="Choose option"
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ]}
  placeholder="Select..."
/>
```

#### Textarea
Multi-line text input with resize options.

```tsx
import { Textarea } from '@/components/ui';

<Textarea
  label="Message"
  rows={4}
  resize="vertical"
/>
```

#### Checkbox
Animated checkbox with custom styling.

```tsx
import { Checkbox } from '@/components/ui';

<Checkbox
  label="Accept terms"
  checked={value}
  onChange={(e) => setValue(e.target.checked)}
/>
```

#### Switch
Toggle switch with smooth animation.

```tsx
import { Switch } from '@/components/ui';

<Switch
  label="Enable notifications"
  description="Receive email updates"
  size="md"
/>
```

### Layout Components

#### Card
Container component with multiple variants.

```tsx
import { Card } from '@/components/ui';

<Card variant="elevated" padding="lg" hoverable>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

**Props:**
- `variant`: 'default' | 'bordered' | 'elevated' | 'flat'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hoverable`: boolean

#### Modal
Accessible modal dialog with animations.

```tsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  description="Modal description"
  size="md"
  footer={<Button>Confirm</Button>}
>
  Modal content
</Modal>
```

### Feedback Components

#### Alert
Contextual alert messages with icons.

```tsx
import { Alert } from '@/components/ui';

<Alert
  variant="success"
  title="Success!"
  message="Operation completed"
  dismissible
  onDismiss={() => {}}
/>
```

#### Badge
Small status indicators.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="primary" size="md" dot>
  Active
</Badge>
```

#### Toast Notifications
Global toast notification system.

```tsx
import { showToast } from '@/lib/toast';

// Success toast
showToast.success('Operation successful!', 'Success');

// Error toast
showToast.error('Something went wrong', 'Error');

// Warning toast
showToast.warning('Please review your input');

// Info toast
showToast.info('Here is some information');

// Promise toast
showToast.promise(
  fetchData(),
  {
    loading: 'Loading...',
    success: 'Data loaded!',
    error: 'Failed to load data',
  }
);
```

#### Tooltip
Hover tooltips with multiple positions.

```tsx
import { Tooltip } from '@/components/ui';

<Tooltip content="Helpful text" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

### Loading States

#### Spinner
Animated loading spinner.

```tsx
import { Spinner } from '@/components/ui';

<Spinner size="md" variant="primary" />
```

#### Skeleton
Content placeholder loaders.

```tsx
import { Skeleton } from '@/components/ui';

<Skeleton width="100%" height={20} animation="pulse" />
```

#### Progress Bar
Animated progress indicator.

```tsx
import { ProgressBar } from '@/components/ui';

<ProgressBar value={60} max={100} variant="primary" showLabel />
```

#### Page Loader
Full-page loading overlay.

```tsx
import { PageLoader } from '@/components/ui';

<PageLoader message="Loading..." />
```

## Animation Variants

Pre-configured Framer Motion animation variants are available:

```tsx
import { fadeInUp, scaleIn, slideInFromBottom } from '@/lib/motion-variants';
import { motion } from 'framer-motion';

<motion.div
  variants={fadeInUp}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Content
</motion.div>
```

**Available variants:**
- `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`
- `scaleIn`, `scaleInCenter`
- `slideInFromBottom`, `slideInFromTop`, `slideInFromLeft`, `slideInFromRight`
- `staggerContainer`, `staggerItem`
- `modalBackdrop`, `modalContent`
- `toastVariants`
- `listItem`, `cardHover`

## Icon Library

Centralized icon exports from Lucide React:

```tsx
import { Icons } from '@/lib/icons';

<Icons.user size={20} />
<Icons.message size={24} className="text-primary-600" />
<Icons.settings size={18} />
```

## Color System

The design system uses a comprehensive color palette:

- **Primary**: Deep Purple/Indigo (main brand color)
- **Secondary**: Cyan/Teal (accent color)
- **Success**: Blue (positive actions)
- **Danger**: Rose/Pink (errors, destructive actions)
- **Warning**: Yellow (warnings, cautions)
- **Neutral**: Slate (text, borders, backgrounds)

Each color has 9 shades (50-900) for flexibility.

## Utility Classes

Custom utility classes available:

```css
/* Glass morphism */
.glass

/* Gradient text */
.gradient-text

/* Card hover effect */
.card-hover

/* Focus ring */
.focus-ring

/* Multi-line truncate */
.truncate-2
.truncate-3

/* Hide scrollbar */
.scrollbar-hide

/* Animation delays */
.animation-delay-100
.animation-delay-200
/* ... up to 500 */
```

## Best Practices

1. **Use semantic variants**: Choose button/alert variants that match the action intent
2. **Consistent spacing**: Use Tailwind spacing scale (4px increments)
3. **Accessibility**: Always provide labels for form inputs
4. **Loading states**: Show loading indicators for async operations
5. **Error handling**: Display clear error messages with the error prop
6. **Responsive design**: Test components on mobile, tablet, and desktop
7. **Animation performance**: Use transform and opacity for smooth animations

## Component Showcase

View all components in action:

```tsx
import ComponentShowcase from '@/components/ui/ComponentShowcase';

<ComponentShowcase />
```

## TypeScript Support

All components are fully typed with TypeScript. Import types as needed:

```tsx
import { ButtonProps, InputProps, ModalProps } from '@/components/ui';
```

## Contributing

When adding new components:
1. Follow existing naming conventions
2. Include TypeScript types
3. Add Framer Motion animations where appropriate
4. Document props and usage examples
5. Export from `index.ts`
6. Update this README
