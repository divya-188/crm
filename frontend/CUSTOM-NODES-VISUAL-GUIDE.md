# Custom Flow Builder Nodes - Visual Guide

## Node Gallery

This guide provides a visual description of all custom node components implemented for the Flow Builder.

---

## 1. Start Node (Entry Point)

**Type**: `start`  
**Color**: Green (`#10b981`)  
**Shape**: Circular with gradient

```
┌─────────────────────┐
│   ▶ Start           │  ← Rotating play icon
│   (Green gradient)  │
└──────────┬──────────┘
           │ (output)
```

**Features**:
- Circular shape with gradient background
- Rotating play icon animation
- Only has output handle (bottom)
- No delete/configure buttons
- Glow effect on selection

---

## 2. Message Node

**Type**: `message`  
**Color**: Purple (`#8b5cf6`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ 💬 Send Message    ⚙️ 🗑️│
│                         │
│ "Hello, welcome to..."  │
│                         │
│ ⚠️ Configuration req.   │ ← If not configured
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- Message preview in content area
- Settings and delete buttons on hover
- Validation indicator if unconfigured
- Purple theme with icon

---

## 3. Template Node

**Type**: `template`  
**Color**: Purple (`#7c3aed`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ 📄 Send Template   ⚙️ 🗑️│
│                         │
│ Template: Welcome_Msg   │
│                         │
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- Template name display
- WhatsApp template integration
- Similar styling to Message node

---

## 4. Condition Node (Branching)

**Type**: `condition`  
**Color**: Cyan (`#06b6d4`)  
**Shape**: Rounded rectangle with dual outputs

```
        (input)
           │
┌──────────┴───────────────┐
│ 🔀 Condition        ⚙️ 🗑️│
│                          │
│ If user_age > 18         │
│                          │
│ ✓ True        ✗ False    │
└─────┬──────────────┬─────┘
      │              │
   (true)         (false)
```

**Features**:
- Two output handles (true/false)
- Color-coded outputs (green/red)
- Branch labels displayed
- Condition preview

---

## 5. Input Node

**Type**: `input`  
**Color**: Orange (`#f59e0b`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ ⌨️ Capture Input   ⚙️ 🗑️│
│                         │
│ "What's your name?"     │
│                         │
│ Save as: user_name      │
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- Prompt text display
- Variable name in code style
- Orange theme
- Input capture indicator

---

## 6. Button Node

**Type**: `button`  
**Color**: Orange (`#d97706`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ ⬜ Button Choice   ⚙️ 🗑️│
│                         │
│ ┌─────────────────┐    │
│ │   Option 1      │    │
│ └─────────────────┘    │
│ ┌─────────────────┐    │
│ │   Option 2      │    │
│ └─────────────────┘    │
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- Button preview display
- Multiple button support
- Orange accent theme
- Interactive button styling

---

## 7. Delay Node

**Type**: `delay`  
**Color**: Cyan (`#0891b2`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ 🕐 Delay           ⚙️ 🗑️│
│                         │
│ Wait 5 minutes          │
│                         │
│  🕐 5 minutes           │ ← Rotating clock
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- Duration display
- Rotating clock animation
- Time unit display
- Cyan theme

---

## 8. API Node

**Type**: `api`  
**Color**: Blue (`#3b82f6`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ ⚡ API Request     ⚙️ 🗑️│
│                         │
│ POST                    │
│ https://api.example...  │
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- HTTP method badge (color-coded)
- URL display in monospace
- Blue theme
- API integration indicator

---

## 9. Webhook Node

**Type**: `webhook`  
**Color**: Blue (`#2563eb`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ 📤 Webhook         ⚙️ 🗑️│
│                         │
│ https://webhook.site... │
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- Webhook URL display
- Monospace font for URL
- Blue theme
- Send icon

---

## 10. Assignment Node

**Type**: `assignment`  
**Color**: Blue (`#1e40af`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ 👤+ Assign Agent   ⚙️ 🗑️│
│                         │
│ Assign to: John Doe     │
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- Agent name display
- User plus icon
- Blue theme
- Assignment indicator

---

## 11. Tag Node

**Type**: `tag`  
**Color**: Blue (`#1e3a8a`)  
**Shape**: Rounded rectangle

```
     (input)
        │
┌───────┴────────────────┐
│ 🏷️ Add Tag         ⚙️ 🗑️│
│                         │
│ [VIP] [Premium]         │ ← Tag badges
└───────┬─────────────────┘
        │ (output)
```

**Features**:
- Tag badges display
- Multiple tag support
- Blue theme
- Tag icon

---

## 12. End Node (Exit Point)

**Type**: `end`  
**Color**: Red (`#f43f5e`)  
**Shape**: Circular with gradient

```
     (input)
        │
┌───────┴──────────┐
│   ✕ End          │
│   (Red gradient) │
└──────────────────┘
```

**Features**:
- Circular shape with gradient
- X icon (no animation)
- Only has input handle (top)
- No delete/configure buttons
- Red theme for termination

---

## Common Features Across All Nodes

### Action Buttons (Appear on Hover/Selection)
```
⚙️ Settings - Opens configuration modal
🗑️ Delete - Removes node from flow
```

### Validation Indicator (When Unconfigured)
```
┌─────────────────────────┐
│ ⚠️ Configuration required│
└─────────────────────────┘
```

### Selection State
- Border changes to node type color
- Glow effect appears
- Ring animation (2px ring)
- Action buttons become visible

### Hover State
- Scale increases to 1.02x
- Action buttons fade in
- Smooth transition (0.2s)

---

## Animation Timeline

### Entry Animation (0.2s)
```
Scale: 0.8 → 1.0
Opacity: 0 → 1
```

### Hover Animation (0.2s)
```
Scale: 1.0 → 1.02
Action Buttons: opacity 0 → 1
```

### Selection Animation
```
Border: neutral → type color
Shadow: normal → glow
Ring: none → 2px ring
```

### Validation Animation (0.2s)
```
Position: y: -5 → 0
Opacity: 0 → 1
```

---

## Color Reference

| Node Type | Primary Color | Hex Code |
|-----------|--------------|----------|
| Start | Green | #10b981 |
| Message | Purple | #8b5cf6 |
| Template | Purple | #7c3aed |
| Condition | Cyan | #06b6d4 |
| Input | Orange | #f59e0b |
| Button | Orange | #d97706 |
| Delay | Cyan | #0891b2 |
| API | Blue | #3b82f6 |
| Webhook | Blue | #2563eb |
| Assignment | Blue | #1e40af |
| Tag | Blue | #1e3a8a |
| End | Red | #f43f5e |

---

## Handle Colors

| Handle Type | Color | Position |
|-------------|-------|----------|
| Input (Target) | Matches node type | Top |
| Output (Source) | Matches node type | Bottom |
| True Branch | Green (#10b981) | Bottom Left |
| False Branch | Red (#f43f5e) | Bottom Right |

---

## Usage in Flow Builder

1. **Drag from Palette**: Drag node type from left sidebar
2. **Drop on Canvas**: Release to create node
3. **Configure**: Click settings icon to configure
4. **Connect**: Drag from output handle to input handle
5. **Select**: Click node to select
6. **Delete**: Press Delete key or click trash icon

---

## Responsive Behavior

- **Min Width**: 220px
- **Max Width**: 280px
- **Height**: Auto (based on content)
- **Padding**: 16px (4 in Tailwind)
- **Border Radius**: 8px (lg in Tailwind)
- **Border Width**: 2px

---

This visual guide provides a comprehensive overview of all custom node components and their features.
