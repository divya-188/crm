# Custom Flow Builder Nodes Implementation

## Overview

This document describes the implementation of custom animated node components for the Flow Builder feature. The nodes are built using React Flow with Framer Motion animations and follow a consistent design pattern.

## Implementation Summary

### Created Components

1. **MessageNode** - Send text messages to users
2. **TemplateNode** - Send WhatsApp template messages
3. **ConditionNode** - Branch flow based on conditions (with true/false outputs)
4. **InputNode** - Capture user text input
5. **ButtonNode** - Present button choices to users
6. **DelayNode** - Wait for a specified duration
7. **APINode** - Make HTTP API requests
8. **WebhookNode** - Send data to webhook URLs
9. **AssignmentNode** - Assign conversations to agents
10. **TagNode** - Add tags to contacts
11. **StartNode** - Flow entry point (special styling)
12. **EndNode** - Flow exit point (special styling)

## Features Implemented

### ✅ Node Selection
- Visual feedback when nodes are selected
- Border color changes to match node type
- Glow effect and ring animation on selection
- Selected state persists across interactions

### ✅ Node Hover Effects
- Scale animation (1.02x) on hover
- Action buttons fade in/out based on hover state
- Smooth transitions using Framer Motion
- Cursor changes to indicate interactivity

### ✅ Node Configuration Panels
- Settings button appears on hover/selection
- Configure button triggers configuration modal (placeholder)
- Each node type has specific configuration needs
- Visual indicators for unconfigured nodes

### ✅ Node Validation Indicators
- Warning badge for nodes requiring configuration
- `isValid` property in node data
- Color-coded validation states (warning yellow)
- Animated appearance of validation messages

### ✅ Node Deletion
- Delete button appears on hover/selection
- Red hover state for delete action
- Keyboard shortcut support (Delete key)
- Confirmation before deletion (handled by React Flow)

### ✅ Animations
- **Entry Animation**: Scale from 0.8 to 1.0 with fade-in
- **Hover Animation**: Scale to 1.02 with smooth transition
- **Action Buttons**: Fade and scale animation
- **Validation Badge**: Slide up animation
- **Special Nodes**: 
  - StartNode: Rotating play icon
  - DelayNode: Rotating clock icon

## Node Structure

All nodes follow a consistent structure:

```typescript
interface NodeData {
  label: string;           // Display name
  nodeType: string;        // Type identifier
  isValid?: boolean;       // Validation state
  // ... type-specific properties
}
```

### Common Features

1. **Header Section**
   - Icon with colored background
   - Node label
   - Action buttons (Settings, Delete)

2. **Content Section**
   - Type-specific content display
   - Configuration preview
   - Empty state messages

3. **Validation Section**
   - Warning indicator
   - Configuration required message

4. **Handles**
   - Input handle (top)
   - Output handle(s) (bottom)
   - Color-coded by node type

## Color Scheme

Nodes use a consistent color palette:

- **Primary (Purple)**: Message, Template nodes - `#8b5cf6`
- **Secondary (Cyan)**: Condition, Delay nodes - `#06b6d4`
- **Accent (Orange)**: Input, Button nodes - `#f59e0b`
- **Success (Blue)**: API, Webhook, Assignment, Tag nodes - `#3b82f6`
- **Success (Green)**: Start node - `#10b981`
- **Danger (Red)**: End node - `#f43f5e`
- **Warning (Yellow)**: Validation indicators - `#eab308`

## Special Node Types

### ConditionNode
- Has two output handles (true/false)
- Positioned at 30% and 70% of bottom edge
- Color-coded handles (green for true, red for false)
- Branch labels displayed in node

### StartNode & EndNode
- Circular shape with gradient background
- No delete/configure buttons
- Special animations (rotating icon)
- StartNode only has output handle
- EndNode only has input handle

## Integration with Flow Builder

The custom nodes are integrated into the Flow Builder:

```typescript
import { nodeTypes } from '@/components/flow-builder';

<ReactFlow
  nodeTypes={nodeTypes}
  // ... other props
/>
```

## File Structure

```
frontend/src/components/flow-builder/
├── nodes/
│   ├── MessageNode.tsx
│   ├── TemplateNode.tsx
│   ├── ConditionNode.tsx
│   ├── InputNode.tsx
│   ├── ButtonNode.tsx
│   ├── DelayNode.tsx
│   ├── APINode.tsx
│   ├── WebhookNode.tsx
│   ├── AssignmentNode.tsx
│   ├── TagNode.tsx
│   ├── StartNode.tsx
│   ├── EndNode.tsx
│   └── index.ts
├── NodePalette.tsx
└── index.ts
```

## Usage Example

```typescript
// Creating a new node
const newNode = {
  id: 'node-1',
  type: 'message',
  position: { x: 100, y: 100 },
  data: {
    label: 'Send Message',
    nodeType: 'message',
    message: 'Hello, welcome!',
    isValid: true,
  },
};

// Adding to flow
setNodes((nds) => [...nds, newNode]);
```

## Future Enhancements

The following features are prepared for future implementation:

1. **Configuration Modals**
   - Each node type needs a specific configuration modal
   - Modal should open when Settings button is clicked
   - Save configuration to node data

2. **Node Validation Logic**
   - Implement validation rules for each node type
   - Update `isValid` property based on configuration
   - Show specific validation messages

3. **Execution Visualization**
   - Highlight nodes during flow execution
   - Animate edges to show flow path
   - Display execution state in nodes

4. **Advanced Features**
   - Copy/paste nodes
   - Duplicate nodes
   - Node templates
   - Undo/redo support

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 2.1**: Visual drag-and-drop interface with multiple node types
- **Requirement 2.4**: Flow validation and error highlighting
- Node selection with visual feedback
- Hover effects with smooth animations
- Configuration panel placeholders
- Validation indicators
- Node deletion functionality

## Testing

To test the custom nodes:

1. Navigate to the Flow Builder page
2. Drag nodes from the palette onto the canvas
3. Observe entry animations
4. Hover over nodes to see action buttons
5. Click nodes to select them
6. Press Delete key to remove selected nodes
7. Connect nodes to create a flow

## Dependencies

- `reactflow`: ^11.x - Flow diagram library
- `framer-motion`: ^10.x - Animation library
- `lucide-react`: ^0.x - Icon library
- `tailwindcss`: ^3.x - Styling

## Notes

- All nodes use Framer Motion for smooth animations
- Tailwind CSS classes are used for styling
- The `cn()` utility function combines class names
- Node handles are styled with custom colors
- Shadow effects enhance depth perception
