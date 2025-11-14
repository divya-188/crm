# Flow Execution Visualization - Visual Guide

## Overview
This guide provides a visual walkthrough of the flow execution visualization feature, showing how to test and debug chatbot flows.

## User Interface Components

### 1. Flow Builder Toolbar
```
┌─────────────────────────────────────────────────────────────┐
│  Untitled Flow                                    Draft     │
│                                                               │
│  [Import] [Export] [Test] [View Execution] [Save]           │
└─────────────────────────────────────────────────────────────┘
```

**Buttons:**
- **Test**: Opens test data modal to start execution
- **View Execution**: Shows execution panel (appears after testing)
- **Save**: Saves the flow (required before testing)

### 2. Test Data Modal
```
┌─────────────────────────────────────────────────────────────┐
│  Test Flow Execution                                    [X] │
│  Provide test data to simulate flow execution               │
│                                                               │
│  Test Variables                          [+ Add Variable]   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Variable Name: userName                               │  │
│  │ Value: John Doe                                  [🗑] │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Variable Name: userEmail                              │  │
│  │ Value: john@example.com                          [🗑] │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  💡 Tips:                                                    │
│  • Variable names should match those used in your flow      │
│  • Values can be text, numbers, or JSON objects            │
│  • Leave empty to use default test values                  │
│                                                               │
│                                    [Cancel] [Start Test]    │
└─────────────────────────────────────────────────────────────┘
```

### 3. Execution Panel (Logs Tab)
```
┌─────────────────────────────────────────────────────────────┐
│  👁 Execution Viewer                                    [X] │
├─────────────────────────────────────────────────────────────┤
│  [▶ Play] [↻ Reset]                      Step 3 / 8        │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────────────────────────────────────────┤
│  [Execution Logs] [Variables]                               │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ▶ Start                                    [start]    │  │
│  │   execute                                              │  │
│  │   10:30:00 • 5ms                                  [▼] │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ▶ Send Welcome Message                    [message]  │  │
│  │   execute                                              │  │
│  │   10:30:01 • 12ms                                 [▼] │  │
│  │   ┌─────────────────────────────────────────────────┐ │  │
│  │   │ 📝 Execution Data                               │ │  │
│  │   │ {                                               │ │  │
│  │   │   "message": "Hello {{userName}}!",            │ │  │
│  │   │   "variables": { "userName": "John Doe" }      │ │  │
│  │   │ }                                               │ │  │
│  │   └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ▶ Check User Type                      [condition]   │  │
│  │   execute                                              │  │
│  │   10:30:02 • 8ms                                  [▼] │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4. Execution Panel (Variables Tab)
```
┌─────────────────────────────────────────────────────────────┐
│  👁 Execution Viewer                                    [X] │
├─────────────────────────────────────────────────────────────┤
│  [▶ Play] [↻ Reset]                      Step 3 / 8        │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────────────────────────────────────────┤
│  [Execution Logs] [Variables]                               │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ userName                                              │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ "John Doe"                                      │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ userEmail                                             │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ "john@example.com"                              │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ apiResponse                                           │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ {                                               │   │  │
│  │ │   "status": 200,                                │   │  │
│  │ │   "data": { "success": true }                   │   │  │
│  │ │ }                                               │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5. Flow Canvas with Execution Highlighting
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│         ┌─────────────┐                                      │
│         │   START     │  ← Completed (green shadow)         │
│         │  (active)   │                                      │
│         └──────┬──────┘                                      │
│                │ ═══════  ← Animated edge (purple)          │
│                ▼                                             │
│         ┌─────────────┐                                      │
│         │   SEND      │  ← Current (pulsing)                │
│         │  MESSAGE    │                                      │
│         └──────┬──────┘                                      │
│                │ ───────  ← Inactive edge (gray)            │
│                ▼                                             │
│         ┌─────────────┐                                      │
│         │  CONDITION  │  ← Not executed (dimmed)            │
│         │             │                                      │
│         └──────┬──────┘                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Visual States

### Node States

#### 1. Completed Node
```
┌─────────────┐
│   MESSAGE   │  ← Green shadow
│  ✓ Sent     │     Opacity: 1.0
└─────────────┘
```

#### 2. Current Node (Executing)
```
┌─────────────┐
│   INPUT     │  ← Purple pulsing shadow
│  Waiting... │     Animation: pulse
└─────────────┘
```

#### 3. Inactive Node
```
┌─────────────┐
│   DELAY     │  ← No shadow
│  Not yet    │     Opacity: 0.3
└─────────────┘
```

### Edge States

#### 1. Completed Edge
```
Node A ═══════════════════> Node B
       Purple, thick (3px)
       Animated flow
```

#### 2. Inactive Edge
```
Node A ───────────────────> Node B
       Gray, thin (2px)
       No animation
```

## Color Coding

### Node Type Colors

| Node Type   | Background Color | Text Color |
|-------------|------------------|------------|
| Start       | Green (100)      | Green (700)|
| End         | Red (100)        | Red (700)  |
| Message     | Purple (100)     | Purple (700)|
| Condition   | Cyan (100)       | Cyan (700) |
| Input       | Amber (100)      | Amber (700)|
| Delay       | Teal (100)       | Teal (700) |
| API         | Blue (100)       | Blue (700) |

### Action Icons

| Action  | Icon | Color      |
|---------|------|------------|
| Enter   | →    | Blue (500) |
| Execute | ▶    | Green (500)|
| Exit    | ✓    | Green (600)|
| Branch  | ⚠    | Yellow (500)|

## Animations

### 1. Pulse Animation (Current Node)
```
Frame 1: ●○○○○  (small shadow)
Frame 2: ○●○○○  (medium shadow)
Frame 3: ○○●○○  (large shadow)
Frame 4: ○○○●○  (medium shadow)
Frame 5: ○○○○●  (small shadow)
Duration: 1 second, infinite loop
```

### 2. Flow Animation (Active Edge)
```
Frame 1: ═══════════════>
Frame 2: ─═══════════════>
Frame 3: ──═══════════════>
Frame 4: ───═══════════════>
Duration: 1 second, infinite loop
```

### 3. Panel Slide-in
```
Frame 1: |                    [Panel off-screen]
Frame 2: |        [Panel]     [Sliding in]
Frame 3: |    [Panel]         [Almost there]
Frame 4: |[Panel]             [Fully visible]
Duration: 0.3 seconds, spring animation
```

## User Workflows

### Workflow 1: Test a New Flow

1. **Create Flow**
   ```
   User creates flow with nodes and connections
   ```

2. **Save Flow**
   ```
   Click "Save" button → Flow saved to database
   ```

3. **Open Test Modal**
   ```
   Click "Test" button → Test Data Modal opens
   ```

4. **Provide Test Data**
   ```
   Add variables:
   - userName: "John Doe"
   - userEmail: "john@example.com"
   Click "Start Test"
   ```

5. **View Execution**
   ```
   Execution Panel opens automatically
   Logs appear in real-time
   Variables update as flow executes
   ```

6. **Review Results**
   ```
   Check execution path
   Review logs for each node
   Inspect final variable values
   ```

### Workflow 2: Debug a Failed Flow

1. **Run Test**
   ```
   Execute flow with test data
   Flow fails at specific node
   ```

2. **Check Error**
   ```
   Red error banner appears
   Error message: "Node condition-2 not found in flow"
   ```

3. **Review Logs**
   ```
   Switch to Logs tab
   Find last successful node
   Identify failure point
   ```

4. **Inspect Variables**
   ```
   Switch to Variables tab
   Check variable values at failure
   Identify missing or incorrect data
   ```

5. **Fix Flow**
   ```
   Close execution panel
   Fix node connections
   Update node configuration
   ```

6. **Re-test**
   ```
   Click "Test" again
   Verify fix worked
   Check execution completes successfully
   ```

### Workflow 3: Replay Execution

1. **Open Execution Panel**
   ```
   Click "View Execution" button
   Previous test results load
   ```

2. **Reset to Beginning**
   ```
   Click "Reset" button
   Execution resets to step 0
   All nodes return to inactive state
   ```

3. **Step Through Execution**
   ```
   Click "Play" button
   Watch step-by-step execution
   Nodes highlight one by one
   Edges animate in sequence
   ```

4. **Pause at Specific Step**
   ```
   Click "Pause" button
   Execution stops at current step
   Review logs and variables
   ```

5. **Resume Execution**
   ```
   Click "Play" button again
   Execution continues from current step
   ```

## Tips and Tricks

### 1. Quick Testing
- Use empty test data for simple flows
- Default values will be used automatically
- Faster than entering all variables

### 2. Debugging Conditions
- Expand condition node logs
- Check "result" field to see which branch was taken
- Verify condition logic matches expectations

### 3. Variable Tracking
- Keep Variables tab open during execution
- Watch variables update in real-time
- Copy values for use in other tests

### 4. Performance Analysis
- Check duration field in logs
- Identify slow nodes
- Optimize complex conditions or API calls

### 5. Visual Inspection
- Watch execution path carefully
- Verify nodes execute in expected order
- Check for unexpected branches

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Space    | Play/Pause execution |
| R        | Reset execution |
| ←        | Previous step |
| →        | Next step |
| Esc      | Close execution panel |

## Best Practices

### 1. Test Data Preparation
✅ **Do:**
- Use realistic data similar to production
- Test with edge cases (empty, null, special chars)
- Provide all required variables

❌ **Don't:**
- Use production credentials
- Test with sensitive data
- Skip variable validation

### 2. Flow Testing
✅ **Do:**
- Test happy path first
- Test all condition branches
- Verify error handling

❌ **Don't:**
- Skip testing before deployment
- Ignore warning messages
- Test only one scenario

### 3. Debugging
✅ **Do:**
- Review logs chronologically
- Check variable values at each step
- Use visual highlighting to verify path

❌ **Don't:**
- Skip log details
- Ignore execution duration
- Assume variables are correct

## Troubleshooting

### Issue: Test button is disabled
**Cause:** Flow not saved or no start node
**Solution:**
1. Click "Save" button to save flow
2. Verify flow has a start node
3. Check flow validation errors

### Issue: Execution not starting
**Cause:** API connection error or invalid flow
**Solution:**
1. Check browser console for errors
2. Verify backend is running
3. Check flow structure is valid

### Issue: Variables not showing
**Cause:** No variables used in flow
**Solution:**
1. Add input nodes to capture variables
2. Use {{variableName}} syntax in messages
3. Provide test data in modal

### Issue: Slow execution
**Cause:** Complex flow or browser performance
**Solution:**
1. Simplify flow structure
2. Reduce number of nodes
3. Close other browser tabs
4. Check browser performance

## Conclusion

The flow execution visualization feature provides a powerful testing and debugging environment. Use this guide to:
- Test flows before deployment
- Debug execution issues
- Optimize flow performance
- Understand flow behavior
- Train team members

For more details, see the comprehensive documentation in `FLOW-EXECUTION-VISUALIZATION.md`.
