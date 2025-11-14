# Node Configuration Modals Implementation

## Overview

This document describes the implementation of configuration modals for the Flow Builder nodes. Each configurable node type (Message, Condition, Input, API, and Delay) now has a dedicated modal that allows users to set up the node's behavior and parameters.

## Components Created

### 1. VariablePicker Component
**Location:** `frontend/src/components/flow-builder/VariablePicker.tsx`

A reusable component that provides a searchable dropdown for selecting variables to insert into text fields.

**Features:**
- Searchable variable list
- Displays variable type and description
- Formats variables with double curly braces `{{variable}}`
- Default variables include contact info, user input, and flow context

**Usage:**
```tsx
<VariablePicker
  onSelect={(variable) => handleVariableInsert(variable)}
  placeholder="Insert variable"
/>
```

### 2. MessageNodeModal
**Location:** `frontend/src/components/flow-builder/modals/MessageNodeModal.tsx`

Configures message nodes that send text to users.

**Configuration Options:**
- **Node Label:** Display name for the node
- **Message Content:** The text message to send (supports variables)
- **Variable Picker:** Insert dynamic variables into the message
- **Live Preview:** Shows how the message will appear

**Data Structure:**
```typescript
interface MessageNodeData {
  message: string;
  label?: string;
}
```

### 3. ConditionNodeModal
**Location:** `frontend/src/components/flow-builder/modals/ConditionNodeModal.tsx`

Configures conditional branching nodes with multiple rules.

**Configuration Options:**
- **Node Label:** Display name for the node
- **Logic Type:** AND (all conditions must be true) or OR (any condition can be true)
- **Condition Rules:** Multiple rules with:
  - Variable to check
  - Operator (equals, contains, greater than, etc.)
  - Comparison value
- **Add/Remove Rules:** Dynamic rule management

**Data Structure:**
```typescript
interface ConditionNodeData {
  label?: string;
  logic: 'AND' | 'OR';
  rules: ConditionRule[];
}

interface ConditionRule {
  variable: string;
  operator: string;
  value: string;
}
```

**Supported Operators:**
- equals, not_equals
- contains, not_contains
- starts_with, ends_with
- greater_than, less_than
- is_empty, is_not_empty

### 4. InputNodeModal
**Location:** `frontend/src/components/flow-builder/modals/InputNodeModal.tsx`

Configures nodes that capture user input and save it to variables.

**Configuration Options:**
- **Node Label:** Display name for the node
- **Prompt Message:** Message asking for user input (supports variables)
- **Variable Name:** Name to save the response under
- **Input Type:** Expected data type (text, number, email, phone, any)
- **Validation Rules:**
  - Required/optional
  - Min/max length (for text)
- **Custom Error Message:** Message shown when validation fails

**Data Structure:**
```typescript
interface InputNodeData {
  label?: string;
  prompt: string;
  variableName: string;
  inputType: 'text' | 'number' | 'email' | 'phone' | 'any';
  validation?: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  errorMessage?: string;
}
```

### 5. APINodeModal
**Location:** `frontend/src/components/flow-builder/modals/APINodeModal.tsx`

Configures nodes that make HTTP requests to external APIs.

**Configuration Options:**
- **Node Label:** Display name for the node
- **HTTP Method:** GET, POST, PUT, PATCH, DELETE
- **URL:** API endpoint (supports variables)
- **Headers:** Custom HTTP headers (key-value pairs)
- **Request Body:** JSON payload for POST/PUT/PATCH (supports variables)
- **Response Variable:** Variable name to store the API response
- **Timeout:** Maximum wait time in seconds (1-300)

**Data Structure:**
```typescript
interface APINodeData {
  label?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Array<{ key: string; value: string }>;
  body?: string;
  responseVariable?: string;
  timeout?: number;
}
```

### 6. DelayNodeModal
**Location:** `frontend/src/components/flow-builder/modals/DelayNodeModal.tsx`

Configures nodes that pause flow execution for a specified duration.

**Configuration Options:**
- **Node Label:** Display name for the node
- **Duration:** Numeric value for the delay
- **Unit:** seconds, minutes, hours, or days
- **Duration Summary:** Shows total delay in seconds

**Data Structure:**
```typescript
interface DelayNodeData {
  label?: string;
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}
```

## Integration with FlowBuilder

### Modal State Management

The FlowBuilder component manages all modal states:

```typescript
const [messageModalOpen, setMessageModalOpen] = useState(false);
const [conditionModalOpen, setConditionModalOpen] = useState(false);
const [inputModalOpen, setInputModalOpen] = useState(false);
const [apiModalOpen, setApiModalOpen] = useState(false);
const [delayModalOpen, setDelayModalOpen] = useState(false);
const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
```

### Opening Configuration Modals

When a user clicks the "Configure" button on a node:

1. The node calls `data.onConfigure(nodeId, nodeType)`
2. FlowBuilder's `openNodeConfig` function is triggered
3. The appropriate modal is opened based on node type
4. The selected node ID is stored for later updates

### Saving Configuration

When a user saves configuration:

1. Modal calls the appropriate save handler (e.g., `handleSaveMessageNode`)
2. The handler updates the node's data in the React Flow state
3. The node's `isValid` flag is set to `true`
4. The modal closes and selected node ID is cleared

### Node Data Updates

Each node receives an `onConfigure` callback through its data:

```typescript
const newNode: Node = {
  id: `node-${nodeIdCounter}`,
  type: type,
  position,
  data: { 
    label: label || type,
    nodeType: type,
    isValid: false,
    onConfigure: (nodeId: string, nodeType: string) => openNodeConfig(nodeId, nodeType),
  },
};
```

## Node Component Updates

All configurable node components were updated to:

1. Accept `onConfigure` in their data interface
2. Call `data.onConfigure(id, data.nodeType)` when the configure button is clicked
3. Display validation warnings when `isValid` is false

Example from MessageNode:

```typescript
interface MessageNodeData {
  label: string;
  message?: string;
  nodeType: string;
  isValid?: boolean;
  onConfigure?: (nodeId: string, nodeType: string) => void;
}

const handleConfigure = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (data.onConfigure) {
    data.onConfigure(id, data.nodeType);
  }
};
```

## User Experience Features

### 1. Visual Feedback
- Nodes show a warning indicator when not configured (`isValid: false`)
- Configure button appears on hover or when node is selected
- Smooth animations for modal open/close

### 2. Validation
- Required fields are marked with asterisks
- Save button is disabled until all required fields are filled
- Real-time validation feedback

### 3. Previews
- Each modal includes a preview section
- Shows how the configured node will appear/behave
- Helps users verify their configuration before saving

### 4. Tips and Guidance
- Each modal includes contextual tips
- Explains best practices and common use cases
- Provides examples and recommendations

### 5. Variable Support
- Variable picker available in relevant fields
- Variables are formatted consistently with `{{variable}}`
- Search functionality for finding variables quickly

## Testing the Implementation

### Manual Testing Steps

1. **Open Flow Builder**
   - Navigate to the Flow Builder page
   - Verify the canvas loads correctly

2. **Add Nodes**
   - Drag nodes from the palette onto the canvas
   - Verify new nodes show "Configuration required" warning

3. **Configure Message Node**
   - Click the configure button on a message node
   - Enter a message with variables
   - Verify preview updates in real-time
   - Save and verify node updates

4. **Configure Condition Node**
   - Click configure on a condition node
   - Add multiple rules
   - Switch between AND/OR logic
   - Test different operators
   - Save and verify

5. **Configure Input Node**
   - Click configure on an input node
   - Set prompt and variable name
   - Configure validation rules
   - Save and verify

6. **Configure API Node**
   - Click configure on an API node
   - Set method and URL
   - Add custom headers
   - Add request body (for POST/PUT)
   - Save and verify

7. **Configure Delay Node**
   - Click configure on a delay node
   - Set duration and unit
   - Verify duration summary calculation
   - Save and verify

8. **Variable Picker**
   - Open variable picker in any modal
   - Search for variables
   - Insert variables into text fields
   - Verify correct formatting

## Future Enhancements

### Potential Improvements

1. **Custom Variables**
   - Allow users to define custom variables
   - Store variables at flow level
   - Variable type validation

2. **Advanced Validation**
   - Regex pattern validation for input nodes
   - URL validation for API nodes
   - Cross-node validation (e.g., variable existence)

3. **Templates**
   - Save common configurations as templates
   - Quick apply templates to new nodes
   - Share templates across flows

4. **Testing Mode**
   - Test individual nodes with sample data
   - Preview API responses
   - Validate conditions with test values

5. **Import/Export**
   - Export node configurations
   - Import configurations from other flows
   - Configuration versioning

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.2:** Support conditional branching based on user input, contact attributes, and external API responses
- **Requirement 2.3:** Allow capturing user inputs of various types with validation
- **Requirement 2.5:** Support integration nodes for webhooks, REST APIs, and database operations

## Files Modified

### New Files Created
- `frontend/src/components/flow-builder/VariablePicker.tsx`
- `frontend/src/components/flow-builder/modals/MessageNodeModal.tsx`
- `frontend/src/components/flow-builder/modals/ConditionNodeModal.tsx`
- `frontend/src/components/flow-builder/modals/InputNodeModal.tsx`
- `frontend/src/components/flow-builder/modals/APINodeModal.tsx`
- `frontend/src/components/flow-builder/modals/DelayNodeModal.tsx`
- `frontend/src/components/flow-builder/modals/index.ts`

### Files Modified
- `frontend/src/pages/FlowBuilder.tsx` - Added modal state management and handlers
- `frontend/src/components/flow-builder/nodes/MessageNode.tsx` - Added onConfigure support
- `frontend/src/components/flow-builder/nodes/ConditionNode.tsx` - Added onConfigure support
- `frontend/src/components/flow-builder/nodes/InputNode.tsx` - Added onConfigure support
- `frontend/src/components/flow-builder/nodes/APINode.tsx` - Added onConfigure support
- `frontend/src/components/flow-builder/nodes/DelayNode.tsx` - Added onConfigure support

## Summary

The node configuration modals provide a comprehensive and user-friendly way to configure chatbot flow nodes. Each modal is tailored to its specific node type with appropriate fields, validation, and guidance. The implementation follows React best practices, uses TypeScript for type safety, and integrates seamlessly with the existing Flow Builder architecture.
