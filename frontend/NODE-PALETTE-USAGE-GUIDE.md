# Node Palette Usage Guide

## Quick Start

The Node Palette is now integrated into the Flow Builder at `/flows`. Here's how to use it:

### Basic Usage

1. **Navigate to Flow Builder**
   - Go to `/flows` in your application
   - The Node Palette appears on the left side

2. **Browse Available Nodes**
   - Scroll through 5 categories: Messages, Logic, Input, Actions, Control
   - Each category shows the number of nodes it contains
   - Click category headers to expand/collapse

3. **Search for Nodes**
   - Use the search box at the top of the palette
   - Type node name, description, or type
   - Results filter in real-time
   - Click X to clear search

4. **Add Nodes to Canvas**
   - Click and hold any node in the palette
   - Drag it onto the canvas
   - Release to drop at desired position
   - Node appears with unique ID

### Available Node Types

#### Messages (2 nodes)
- **Send Message** - Send text messages to users
- **Send Template** - Send WhatsApp template messages

#### Logic (3 nodes)
- **Condition** - Branch based on conditions
- **Delay** - Wait for specified time
- **Jump to Node** - Navigate to another node

#### Input (2 nodes)
- **Capture Input** - Capture user text input
- **Button Choice** - Present button options

#### Actions (6 nodes)
- **API Request** - Make HTTP API calls
- **Webhook** - Send data to webhook URLs
- **Google Sheets** - Read/write to spreadsheets
- **Assign Agent** - Assign conversations to agents
- **Add Tag** - Tag contacts
- **Update Field** - Update contact custom fields

#### Control (2 nodes)
- **Start** - Flow entry point
- **End** - Flow exit point

### Tips & Tricks

1. **Keyboard Shortcuts**
   - Delete key: Remove selected nodes
   - Shift + Click: Multi-select nodes
   - Ctrl/Cmd + Scroll: Zoom in/out

2. **Organization**
   - Collapse unused categories to focus on what you need
   - Use search to quickly find specific node types
   - Drag nodes near existing nodes to auto-connect

3. **Visual Feedback**
   - Nodes highlight on hover
   - Color-coded left borders indicate category
   - Icon badges show node type at a glance

### Node Colors

Each node type has a unique color for easy identification:

- **Messages**: Purple shades (#8b5cf6, #7c3aed)
- **Logic**: Cyan shades (#06b6d4, #0891b2, #0e7490)
- **Input**: Amber shades (#f59e0b, #d97706)
- **Actions**: Blue shades (#3b82f6 to #6366f1)
- **Control**: Green (#10b981) and Rose (#f43f5e)

### Integration with Flow Builder

The Node Palette works seamlessly with:

- **React Flow Canvas**: Drag and drop directly onto canvas
- **Snap to Grid**: Nodes align to 15x15 grid automatically
- **Auto-connect**: Connect nodes by dragging from handles
- **Multi-select**: Select and move multiple nodes together
- **Undo/Redo**: Coming soon in future updates

### Customization

Developers can extend the node palette by:

1. **Adding New Node Types**
   - Edit `nodeCategories` array in `NodePalette.tsx`
   - Add new node definition with type, label, icon, description, color

2. **Creating New Categories**
   - Add new category object to `nodeCategories`
   - Specify category name and icon

3. **Custom Node Rendering**
   - Implement custom node components (Task 41)
   - Register in React Flow's `nodeTypes` prop

### Troubleshooting

**Nodes not dropping on canvas?**
- Ensure you're dragging onto the canvas area
- Check that React Flow is properly initialized
- Verify drag handlers are attached

**Search not working?**
- Clear browser cache
- Check console for errors
- Verify Input component is imported correctly

**Categories not collapsing?**
- Check that Framer Motion is installed
- Verify AnimatePresence is wrapping content
- Look for JavaScript errors in console

### Next Steps

After adding nodes to your flow:

1. **Connect Nodes**: Drag from output handle to input handle
2. **Configure Nodes**: Click nodes to open configuration (Task 42)
3. **Test Flow**: Use Test button to simulate execution (Task 43)
4. **Save Flow**: Click Save to persist your flow

### API Reference

#### NodePalette Props

```typescript
interface NodePaletteProps {
  onNodeDragStart?: (event: React.DragEvent, nodeType: string) => void;
}
```

#### Exported Types

```typescript
interface NodeTypeDefinition {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

interface NodeCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  nodes: NodeTypeDefinition[];
}
```

#### Exported Constants

```typescript
export const nodeCategories: NodeCategory[];
```

### Performance Notes

- Search is optimized for real-time filtering
- Category collapse state uses efficient Set data structure
- Animations use GPU-accelerated transforms
- No virtual scrolling needed (15 nodes total)

### Accessibility

- Keyboard navigation supported
- Semantic HTML structure
- Clear visual feedback
- WCAG compliant color contrast
- Screen reader friendly labels

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- No IE11 support

