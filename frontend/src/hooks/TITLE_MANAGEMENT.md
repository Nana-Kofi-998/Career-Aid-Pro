# Browser Tab Title Management System

## Overview

This system provides a modular and reusable solution for managing browser tab titles dynamically based on application state and navigation.

## Features

1. **Configurable default application title** - Set via `appName` option or DEFAULT_APP_NAME constant
2. **Dynamic page-specific titles** - Pass page title as first argument
3. **Loading state indicator** - Shows "(Loading...)" when loading=true
4. **Real-time updates** - Supports unread counts and typing indicators
5. **Automated navigation sync** - Updates automatically with route changes
6. **Dynamic chat titles** - Updates title based on chat session content (similar to ChatGPT)

## Usage Examples

### Basic Page Title

```tsx
import { useTitle } from '../hooks/useTitle';

function DashboardPage() {
  useTitle('Dashboard'); // Sets: "Dashboard | Career-Aid Pro"
  // ... component logic
}
```

### With Loading State

```tsx
import { useTitle } from '../hooks/useTitle';

function SomePage() {
  const [loading, setLoading] = useState(false);
  
  useTitle('My Page', { loading }); // Shows "(Loading...) My Page | Career-Aid Pro" when loading=true
  
  // ... component logic
}
```

### With Unread Notifications

```tsx
import { useTitle } from '../hooks/useTitle';

function ChatPage() {
  const [unreadCount, setUnreadCount] = useState(3);
  
  useTitle('Chat', { unreadCount }); // Shows "(3) Chat | Career-Aid Pro"
  
  // ... component logic
}
```

### With Typing Indicator

```tsx
import { useTitle } from '../hooks/useTitle';

function ChatPage() {
  const [isTyping, setIsTyping] = useState(true);
  
  useTitle('Chat', { isTyping }); // Shows "Chat (typing...) | Career-Aid Pro"
  
  // ... component logic
}
```

### Route-Based Automatic Title Management

For automatic title updates based on React Router navigation, use the `useRouteTitle` hook at the app root:

```tsx
import { useRouteTitle } from '../hooks/useRouteTitle';

function App() {
  // This automatically sets titles based on route path
  useRouteTitle();
  
  return (
    // Your routes here
  );
}
```

### Dynamic Chat Titles (ChatGPT-style)

For chat sessions that need dynamic titles based on conversation content:

```tsx
import { useChatTitle } from '../hooks/useChatTitle';

function ChatPage() {
  // Automatically updates title based on chat messages and context
  useChatTitle();
  
  // ... chat component logic
}
```

### Imperative Title Updates

For cases where you need to update the title outside of React lifecycle:

```tsx
import { setTitle } from '../hooks/useTitle';

// In an event handler or outside React component
setTitle('Notification', { unreadCount: 5 });
```

### Custom App Name

```tsx
useTitle('Page', { appName: 'Custom App Name' });
// Sets: "Page | Custom App Name"
```

## Integration Checklist

1. Add `useTitle('Page Name')` to each static page component
2. Pass relevant state (loading, unreadCount, isTyping) as options
3. Use `useRouteTitle()` at app root for automatic route-based titles
4. Use `useChatTitle()` in chat components for dynamic conversation titles
5. The hook automatically handles cleanup on component unmount
6. No memory leaks - uses ref to track mounted state

## Title Format

### For Static Pages:
```
[loading] [pageTitle] [unreadCount] [isTyping] | [appName]
```

### For Chat Sessions:
```
[context indicators] [chat message preview] | Career Aid
[context indicators] New Chat | Career Aid
```

Where context indicators can include:
- 📄 [filename] - When a CV/document is loaded
- 💙 - Mental Health mode
- 💬 - Free/Open chat mode

## Memory Leak Prevention

All hooks use a `mountedRef` to track component mount status and only update the document title if the component is still mounted. The cleanup function sets `mountedRef.current = false` on unmount, preventing any state updates on unmounted components.

## File Structure

```
frontend/src/hooks/
├── useTitle.ts           # Main hook implementation
├── useRouteTitle.ts       # Route-based title management
├── useChatTitle.ts        # Dynamic chat title management
├── index.ts              # Export file
└── TITLE_MANAGEMENT.md   # This documentation
```