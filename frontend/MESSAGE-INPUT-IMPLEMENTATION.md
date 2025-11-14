# Message Input and Sending Implementation

## Overview

This document describes the implementation of the message input component with full functionality for sending messages, uploading media, adding emojis, and using saved responses.

## Components Implemented

### 1. MessageInput Component (`MessageInput.tsx`)

The main message input component with the following features:

#### Features:
- **Text Input**: Multi-line textarea with auto-resize (max 150px height)
- **Emoji Picker**: Integrated emoji selector with categories
- **Media Upload**: Support for images, videos, audio, and documents
- **Saved Responses**: Quick access to pre-defined message templates
- **File Preview**: Visual preview of attached files before sending
- **Typing Indicators**: Real-time typing status broadcast via WebSocket
- **Optimistic Updates**: Immediate UI feedback when sending messages
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line

#### Key Functionality:
```typescript
- Auto-resize textarea based on content
- Real-time typing indicator emission via WebSocket
- File upload with validation (size limits per media type)
- Optimistic message sending with error handling
- Media URL generation via media service
```

### 2. EmojiPicker Component (`EmojiPicker.tsx`)

A categorized emoji picker with:
- **Categories**: Smileys & People, Gestures, Hearts, Objects, Symbols
- **Grid Layout**: 8 columns for easy browsing
- **Hover Effects**: Scale animation on hover
- **Click Outside**: Auto-close when clicking outside
- **Insertion**: Maintains cursor position when inserting emoji

### 3. MediaUpload Component (`MediaUpload.tsx`)

Media type selector with file validation:

| Media Type | Max Size | Accepted Formats |
|------------|----------|------------------|
| Image | 5 MB | image/* |
| Video | 16 MB | video/* |
| Audio | 16 MB | audio/* |
| Document | 100 MB | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt |

Features:
- Visual icons for each media type
- File size validation
- User-friendly error messages
- Hidden file input with custom UI

### 4. SavedResponsesDropdown Component (`SavedResponsesDropdown.tsx`)

Quick access to saved message templates:
- **Search**: Filter responses by text, shortcut, or category
- **Categories**: Organized by Greetings, Information, Orders, Support
- **Shortcuts**: Quick codes like `/hello`, `/thanks`, `/hours`
- **Usage Stats**: Display usage count for each response
- **Keyboard Navigation**: Search input auto-focused

Mock data includes 8 common responses. In production, this should fetch from API.

### 5. FilePreview Component (`FilePreview.tsx`)

Visual preview of attached files:
- **Image Preview**: Thumbnail display
- **Video Preview**: Thumbnail with play icon overlay
- **Document/Audio**: Icon-based preview
- **File Info**: Name, size, and type display
- **Remove Button**: Easy file removal before sending

### 6. Media Service (`media.service.ts`)

API service for media file operations:
```typescript
- uploadFile(file: File): Promise<{ url: string; id: string }>
- deleteFile(id: string): Promise<void>
- getMediaUrl(id: string): string
```

## Integration

### ConversationView Integration

The MessageInput component is integrated into the ConversationView:

```typescript
<ConversationView>
  <ConversationHeader />
  <MessageList />
  <MessageInput conversationId={conversation.id} />
</ConversationView>
```

### WebSocket Integration

Real-time features:
- **Typing Indicators**: Emits `conversation:typing` events
- **Message Delivery**: Listens for message status updates
- **Optimistic Updates**: Immediate UI feedback before server confirmation

### State Management

Uses React Query for:
- Message sending mutation
- Automatic cache invalidation
- Optimistic updates
- Error handling and retry logic

## User Experience

### Sending Flow

1. User types message or attaches file
2. Typing indicator broadcasts to other participants
3. User clicks send or presses Enter
4. File uploads (if attached) with loading state
5. Message sends with optimistic update
6. UI updates immediately
7. Server confirmation updates message status

### Visual Feedback

- **Loading States**: Spinner on send button during upload/send
- **Animations**: Smooth transitions for all UI elements
- **Hover Effects**: Scale animations on interactive elements
- **Error Handling**: Toast notifications for errors
- **Success States**: Immediate message appearance in chat

## Keyboard Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line in message
- `Escape`: Close emoji picker/media upload/saved responses

## Accessibility

- Proper ARIA labels on buttons
- Keyboard navigation support
- Focus management for modals
- Screen reader friendly

## Performance Optimizations

- Debounced typing indicators (1 second)
- Lazy loading of emoji picker
- File preview using object URLs
- Optimistic updates for instant feedback
- Auto-cleanup of object URLs on unmount

## Future Enhancements

1. **Voice Messages**: Record and send audio messages
2. **Message Editing**: Edit sent messages
3. **Message Reactions**: Quick emoji reactions
4. **Mentions**: @mention other agents
5. **Rich Text**: Bold, italic, links formatting
6. **Drag & Drop**: Drag files directly into input
7. **Paste Images**: Paste from clipboard
8. **Message Templates**: Variable substitution in saved responses
9. **Scheduled Messages**: Schedule messages for later
10. **Message Drafts**: Auto-save drafts per conversation

## Testing Recommendations

### Unit Tests
- Message input validation
- File size validation
- Emoji insertion at cursor position
- Saved response filtering

### Integration Tests
- Message sending flow
- File upload flow
- Typing indicator emission
- Optimistic update behavior

### E2E Tests
- Complete message sending flow
- Media upload and preview
- Emoji picker interaction
- Saved responses selection

## API Requirements

The backend should implement:

### POST /api/v1/conversations/:id/messages
```typescript
Request:
{
  conversationId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  content?: string;
  mediaUrl?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
}

Response:
{
  id: string;
  conversationId: string;
  type: string;
  content?: string;
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  // ... other message fields
}
```

### POST /api/v1/media/upload
```typescript
Request: FormData with 'file' field

Response:
{
  url: string;
  id: string;
}
```

### WebSocket Events

#### Emit:
- `conversation:typing` - { conversationId, isTyping }
- `conversation:join` - { conversationId }
- `conversation:leave` - { conversationId }

#### Listen:
- `message:new` - New message received
- `message:status` - Message status update
- `contact:typing` - Contact typing indicator

## Files Created

1. `frontend/src/features/inbox/MessageInput.tsx` - Main input component
2. `frontend/src/features/inbox/EmojiPicker.tsx` - Emoji selector
3. `frontend/src/features/inbox/MediaUpload.tsx` - Media type selector
4. `frontend/src/features/inbox/SavedResponsesDropdown.tsx` - Saved responses
5. `frontend/src/features/inbox/FilePreview.tsx` - File preview component
6. `frontend/src/services/media.service.ts` - Media upload service

## Files Modified

1. `frontend/src/features/inbox/ConversationView.tsx` - Added MessageInput
2. `frontend/src/features/inbox/index.ts` - Exported new components
3. `frontend/src/services/index.ts` - Exported media service

## Build Status

✅ TypeScript compilation successful
✅ Vite build successful
✅ No runtime errors
✅ All components properly exported

## Requirements Satisfied

✅ **3.2**: Agents SHALL send text messages to contacts
✅ **17.1**: THE System SHALL support sending text, images, videos, audio, and documents
✅ **17.2**: THE System SHALL provide message templates for quick responses

All task requirements have been successfully implemented.
