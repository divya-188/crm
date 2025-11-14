# Flow Execution Visualization Implementation

## Overview

This document describes the implementation of the flow execution visualization feature for the WhatsApp CRM SaaS platform. This feature allows users to test chatbot flows in a sandbox environment with step-by-step execution tracking, visual path highlighting, execution logs, and variable inspection.

## Features Implemented

### 1. Flow Testing Mode

**Backend Implementation:**
- Added `POST /flows/:id/test` endpoint for sandbox execution
- Implemented `testFlowExecution` method in `FlowExecutionService`
- Simulates flow execution without sending actual messages
- Tracks execution path, logs, and context variables
- Handles all node types: start, message, condition, input, delay, API, end

**Frontend Implementation:**
- Test button in FlowBuilder toolbar
- TestDataModal for providing test input variables
- Support for JSON and string values
- Variable name validation

### 2. Execution Path Highlighting

**Visual Features:**
- Real-time node highlighting during execution
- Animated edge highlighting showing flow path
- Current node pulse animation
- Dimmed inactive nodes and edges
- Color-coded execution states

**Implementation:**
- Dynamic node and edge styling based on execution state
- CSS animations for pulse and flow effects
- Smooth transitions between execution steps

### 3. Step-by-Step Animation

**Playback Controls:**
- Play/Pause execution replay
- Reset to beginning
- Manual step navigation
- Progress bar showing execution progress
- Auto-advance with 1-second intervals

**Features:**
- Configurable playback speed (1 second per step)
- Visual feedback for current step
- Automatic pause at completion

### 4. Execution Logs Panel

**Log Display:**
- Chronological list of execution events
- Expandable log entries with detailed data
- Action icons (enter, execute, exit, branch)
- Node type badges with color coding
- Timestamp and duration tracking

**Log Types:**
- Node entry/exit events
- Execution actions
- Branch decisions
- Error messages
- Data transformations

### 5. Variable Inspection

**Context Viewer:**
- Real-time variable values
- JSON formatting for complex objects
- Syntax highlighting
- Variable history tracking
- Type-aware display

**Features:**
- Collapsible variable cards
- Pretty-printed JSON
- String/number/object detection
- Copy-to-clipboard support

### 6. Execution Replay

**Backend Endpoints:**
- `GET /flows/executions/:executionId/logs` - Get execution logs
- `GET /flows/executions/:executionId/replay` - Get replay data

**Replay Features:**
- Load historical executions
- Step-through past executions
- Compare execution paths
- Debug failed executions

## Component Architecture

### Backend Components

#### FlowExecutionService
```typescript
// Test execution with detailed logging
async testFlowExecution(
  flowId: string,
  tenantId: string,
  testData: Record<string, any>
): Promise<TestExecutionResult>

// Get execution logs
async getExecutionLogs(executionId: string): Promise<ExecutionLogs>

// Get replay data
async getExecutionReplay(executionId: string): Promise<ReplayData>
```

#### Node Execution Simulation
- Message nodes: Log message content with variable substitution
- Condition nodes: Evaluate conditions and log results
- Input nodes: Use test data or defaults
- Delay nodes: Simulate without actual delay
- API nodes: Return mock responses
- End nodes: Mark completion

### Frontend Components

#### ExecutionPanel
**Location:** `frontend/src/components/flow-builder/ExecutionPanel.tsx`

**Props:**
```typescript
interface ExecutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
  executionPath: string[];
  finalContext: Record<string, any>;
  isRunning: boolean;
  currentStep: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepChange: (step: number) => void;
  error?: string;
}
```

**Features:**
- Sliding panel from right
- Tabbed interface (Logs / Variables)
- Playback controls
- Progress tracking
- Error display

#### TestDataModal
**Location:** `frontend/src/components/flow-builder/TestDataModal.tsx`

**Props:**
```typescript
interface TestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: (testData: Record<string, any>) => void;
}
```

**Features:**
- Dynamic variable input fields
- Add/remove variables
- JSON value parsing
- Input validation
- Usage tips

#### FlowBuilder Integration
**Location:** `frontend/src/pages/FlowBuilder.tsx`

**New State:**
```typescript
const [testDataModalOpen, setTestDataModalOpen] = useState(false);
const [executionPanelOpen, setExecutionPanelOpen] = useState(false);
const [executionLogs, setExecutionLogs] = useState<any[]>([]);
const [executionPath, setExecutionPath] = useState<string[]>([]);
const [executionContext, setExecutionContext] = useState<Record<string, any>>({});
const [isExecutionRunning, setIsExecutionRunning] = useState(false);
const [currentExecutionStep, setCurrentExecutionStep] = useState(0);
```

**New Methods:**
- `handleTest()` - Open test data modal
- `handleStartTest()` - Execute flow test
- `handlePlayExecution()` - Start playback
- `handlePauseExecution()` - Pause playback
- `handleResetExecution()` - Reset to beginning
- `highlightExecutionPath()` - Update visual highlighting

## API Endpoints

### Test Flow Execution
```
POST /flows/:id/test
```

**Request Body:**
```json
{
  "testData": {
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "customVariable": "test value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "executionPath": ["node-1", "node-2", "node-3"],
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "nodeId": "node-1",
      "nodeName": "Start",
      "nodeType": "start",
      "action": "execute",
      "data": { "message": "Flow started" },
      "duration": 5
    }
  ],
  "finalContext": {
    "userName": "John Doe",
    "userEmail": "john@example.com"
  },
  "error": null
}
```

### Get Execution Logs
```
GET /flows/executions/:executionId/logs
```

**Response:**
```json
{
  "executionId": "uuid",
  "flowId": "uuid",
  "flowName": "Welcome Flow",
  "status": "completed",
  "executionPath": ["node-1", "node-2"],
  "context": {},
  "startedAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:30:15Z",
  "duration": 15000
}
```

### Get Execution Replay
```
GET /flows/executions/:executionId/replay
```

**Response:**
```json
{
  "executionId": "uuid",
  "flowId": "uuid",
  "flowName": "Welcome Flow",
  "flowData": { "nodes": [], "edges": [] },
  "status": "completed",
  "replaySteps": [
    {
      "step": 1,
      "nodeId": "node-1",
      "nodeName": "Start",
      "nodeType": "start",
      "timestamp": "2024-01-15T10:30:00Z",
      "context": {}
    }
  ],
  "finalContext": {},
  "startedAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:30:15Z"
}
```

## Styling

### CSS Classes

**Execution States:**
- `.execution-active` - Currently executing node (pulse animation)
- `.execution-completed` - Completed node (green shadow)
- `.execution-inactive` - Not yet executed (dimmed)

**Animations:**
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
}

@keyframes flowAnimation {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 20; }
}
```

## Usage Guide

### Testing a Flow

1. **Open Flow Builder**
   - Navigate to the Flow Builder page
   - Create or open an existing flow

2. **Configure Test Data**
   - Click the "Test" button in the toolbar
   - Add test variables in the modal
   - Provide values for input nodes
   - Click "Start Test"

3. **View Execution**
   - Execution panel opens automatically
   - Watch step-by-step execution
   - View logs and variables in real-time

4. **Control Playback**
   - Click "Play" to start/resume
   - Click "Pause" to pause
   - Click "Reset" to start over
   - Use progress bar to jump to steps

5. **Inspect Details**
   - Switch to "Logs" tab for execution events
   - Switch to "Variables" tab for context data
   - Expand log entries for detailed information
   - Copy variable values for debugging

### Debugging Failed Executions

1. **Check Error Message**
   - Red error banner shows failure reason
   - Review error details in logs

2. **Inspect Execution Path**
   - See which nodes were executed
   - Identify where execution stopped

3. **Review Variables**
   - Check variable values at failure point
   - Verify data transformations

4. **Replay Execution**
   - Step through execution slowly
   - Pause at problematic nodes
   - Compare expected vs actual behavior

## Best Practices

### Test Data Preparation

1. **Use Realistic Data**
   - Provide data similar to production
   - Test edge cases and boundary conditions
   - Include special characters and formats

2. **Variable Naming**
   - Match variable names used in flow
   - Use descriptive names
   - Follow camelCase convention

3. **Data Types**
   - Use JSON for complex objects
   - Provide numbers without quotes
   - Test with empty/null values

### Flow Testing Strategy

1. **Test Happy Path First**
   - Verify normal execution flow
   - Check all nodes execute correctly
   - Validate output messages

2. **Test Error Conditions**
   - Provide invalid input
   - Test condition branches
   - Verify error handling

3. **Test Performance**
   - Check execution duration
   - Identify slow nodes
   - Optimize complex conditions

### Debugging Tips

1. **Use Execution Logs**
   - Review chronological events
   - Check node execution order
   - Verify data transformations

2. **Inspect Variables**
   - Track variable changes
   - Verify calculations
   - Check API responses

3. **Visual Inspection**
   - Watch path highlighting
   - Identify unexpected branches
   - Verify node connections

## Limitations

### Current Limitations

1. **Simulated Execution**
   - API calls return mock data
   - No actual messages sent
   - Delays are not enforced

2. **Single Execution Path**
   - Condition nodes take first path
   - No parallel execution
   - No loop detection

3. **Limited History**
   - Only current test execution stored
   - No execution comparison
   - No performance metrics

### Future Enhancements

1. **Advanced Features**
   - Multiple execution paths
   - Parallel branch testing
   - Loop detection and limits
   - Performance profiling

2. **Enhanced Debugging**
   - Breakpoint support
   - Variable watching
   - Conditional logging
   - Step-over/step-into

3. **Execution History**
   - Save test executions
   - Compare executions
   - Export test results
   - Execution analytics

## Technical Notes

### Performance Considerations

1. **Large Flows**
   - Limit to 100 nodes per execution
   - Prevent infinite loops
   - Optimize rendering

2. **Memory Management**
   - Clear logs after execution
   - Limit log entry size
   - Cleanup on unmount

3. **Animation Performance**
   - Use CSS transforms
   - Debounce updates
   - Optimize re-renders

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dependencies

- React Flow: ^11.0.0
- Framer Motion: ^10.0.0
- Lucide React: ^0.263.0

## Troubleshooting

### Common Issues

**Issue: Test button disabled**
- Solution: Save flow before testing
- Ensure flow has start node

**Issue: Execution not starting**
- Solution: Check browser console
- Verify API connection
- Check flow validation

**Issue: Variables not showing**
- Solution: Ensure nodes use variables
- Check variable naming
- Verify test data format

**Issue: Slow execution**
- Solution: Reduce animation speed
- Simplify complex flows
- Check browser performance

## Related Requirements

This implementation satisfies the following requirements from the specification:

- **Requirement 2.7**: Flow testing in sandbox environment
- **Requirement 26.1**: Flow performance tracking
- **Requirement 26.2**: Execution analytics and debugging

## Files Modified/Created

### Backend Files
- `backend/src/modules/flows/flows.controller.ts` - Added test endpoints
- `backend/src/modules/flows/services/flow-execution.service.ts` - Added test execution logic

### Frontend Files
- `frontend/src/pages/FlowBuilder.tsx` - Integrated execution visualization
- `frontend/src/components/flow-builder/ExecutionPanel.tsx` - New component
- `frontend/src/components/flow-builder/TestDataModal.tsx` - New component
- `frontend/src/components/flow-builder/index.ts` - Added exports
- `frontend/src/services/flows.service.ts` - Added test methods
- `frontend/src/pages/FlowBuilder.css` - Added execution styles

## Conclusion

The flow execution visualization feature provides a comprehensive testing and debugging environment for chatbot flows. Users can now test flows in a safe sandbox, visualize execution paths, inspect variables, and debug issues before deploying to production. The step-by-step animation and detailed logging make it easy to understand flow behavior and identify problems.
