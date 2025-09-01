# VANA Frontend Error Handling Guide

## Overview

This guide documents the comprehensive error handling system implemented for the VANA frontend, focusing on SSE connection failures, VANA backend issues, and graceful fallbacks.

## Error Classes

### 1. SSEConnectionError
Handles Server-Sent Events connection failures with automatic retry logic.

```typescript
const sseError = new SSEConnectionError(
  'Connection lost',
  {
    retryable: true,
    retryAfter: 5000,
    reconnectAttempt: 2
  }
);
```

**Features:**
- Exponential backoff retry logic
- Maximum retry attempt limits
- Connection timeout handling
- Jitter to prevent thundering herd

### 2. VanaBackendError
Handles VANA API and backend service errors.

```typescript
const vanaError = new VanaBackendError(
  'VANA service temporarily unavailable',
  'SERVICE_UNAVAILABLE',
  503,
  {
    retryable: true,
    details: { endpoint: '/chat/stream' }
  }
);
```

**Features:**
- HTTP status code mapping
- Retryable error classification
- Detailed error context
- User-friendly error messages

### 3. StreamParsingError
Handles JSON/event parsing failures in streaming data.

```typescript
const parseError = new StreamParsingError(
  'Invalid JSON in SSE event',
  rawEventData,
  'json'
);
```

**Features:**
- Raw data preservation for debugging
- Parse stage identification
- Cause chain preservation

## Error Boundary Component

The `ErrorBoundary` component provides React error boundary functionality with specialized handling for streaming errors.

```tsx
<ErrorBoundary
  enableRetry={true}
  maxRetries={3}
  showConnectionStatus={true}
  onError={(error, errorInfo) => {
    console.error('Boundary caught:', error, errorInfo);
  }}
>
  <VanaDataStreamProvider>
    <EnhancedChat {...props} />
  </VanaDataStreamProvider>
</ErrorBoundary>
```

**Features:**
- Automatic retry for retryable errors
- Connection status indicators
- Manual retry controls
- Detailed error information display

## Connection Management

### Exponential Backoff

```typescript
function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  const maxDelay = 30000; // 30 seconds max
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
}
```

### Connection States

1. **connected** - Active SSE connection
2. **disconnected** - No connection
3. **reconnecting** - Attempting to restore connection
4. **failed** - Connection failed after max retries

## Toast Notifications

Error-specific toast notifications provide user feedback:

```typescript
// Connection lost
toast({
  type: 'warning',
  description: 'Connection lost. Retrying in 5s... (2/5)',
});

// Service error
toast({
  type: 'error',
  description: 'VANA service error. Switching to fallback AI provider.',
});

// Success recovery
toast({
  type: 'success',
  description: 'Connection restored successfully.',
});
```

## Fallback Strategies

### 1. Automatic Fallback
When VANA backend fails, automatically switch to Vercel AI:

```typescript
if (!isRetryableError(error) || reconnectAttempts >= maxReconnectAttempts) {
  setUseVanaBackend(false);
  sendVercelMessage(message);
}
```

### 2. Progressive Fallback
1. First attempt: VANA backend
2. Retry attempts: VANA with exponential backoff
3. Final fallback: Vercel AI SDK

### 3. Manual Recovery
Users can manually retry failed connections:

```typescript
<button onClick={() => retryConnection()}>
  Retry Connection
</button>
```

## UI States

### Connection Status Bar
Displays current connection state with visual indicators:

- 🟢 **Connected**: Green indicator, "VANA Backend: Connected"
- 🟡 **Reconnecting**: Yellow pulsing indicator, "Reconnecting... (2/5)"
- 🔴 **Failed**: Red indicator, "Connection Failed" + Retry button

### Error Display
Shows recent connection issues:

```
Recent Connection Issues:
• SSE connection timeout after 15 seconds
• VANA backend returned 503 Service Unavailable
```

### Agent Progress
Enhanced progress display with error states:

```
VANA Agent Progress:
researcher: ████████░░ 80% completed
coder: ██████████ 100% completed
tester: ██░░░░░░░░ 20% failed
```

## Error Handling Patterns

### 1. Try-Catch with Specific Error Types

```typescript
try {
  await startVanaStream(chatId, message, options);
} catch (error) {
  if (error instanceof VanaBackendError) {
    handleVanaError(error);
  } else if (error instanceof SSEConnectionError) {
    handleSSEError(error);
  } else {
    handleGenericError(error);
  }
}
```

### 2. Event-Based Error Handling

```typescript
// Subscribe to connection state changes
useEffect(() => {
  const unsubscribe = onConnectionStateChange((state) => {
    switch (state) {
      case 'failed':
        setUseVanaBackend(false);
        showFallbackNotification();
        break;
    }
  });

  return unsubscribe;
}, [onConnectionStateChange]);
```

### 3. Timeout Management

```typescript
// Request timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
}
```

## Testing Error Scenarios

### 1. Network Failures
```bash
# Simulate network disconnection
# Disable network adapter or use browser dev tools

# Expected behavior:
# - SSE connection error
# - Automatic retry with exponential backoff
# - Toast notification: "Connection lost. Retrying..."
# - Eventually falls back to Vercel AI
```

### 2. VANA Backend Errors
```bash
# Simulate VANA service down
# Return 503 from /api/chat/vana/status

# Expected behavior:
# - VanaBackendError thrown
# - Toast: "VANA backend unavailable. Using fallback AI provider."
# - Immediate switch to Vercel AI
```

### 3. SSE Parsing Errors
```bash
# Send malformed JSON in SSE event
# Invalid event data from VANA backend

# Expected behavior:
# - StreamParsingError thrown
# - Toast: "Data parsing error. Please refresh..."
# - Connection maintains but event skipped
```

### 4. Timeout Scenarios
```bash
# Delay VANA responses beyond timeout limits
# Connection timeout: 15 seconds
# Request timeout: 30 seconds

# Expected behavior:
# - SSEConnectionError with timeout flag
# - Retry with exponential backoff
# - Manual retry button appears
```

## Performance Considerations

### Memory Management
- Error arrays limited to last 5 errors
- Automatic cleanup of event listeners
- Timeout clearance on component unmount

### Network Optimization
- Connection reuse where possible
- Efficient retry scheduling
- Jitter to prevent synchronized retries

### UI Responsiveness
- Non-blocking error handling
- Optimistic UI updates
- Progressive disclosure of error details

## Best Practices

### 1. Error Categorization
Always categorize errors appropriately:
- **Retryable**: Network issues, temporary service unavailability
- **Non-retryable**: Authentication errors, malformed requests
- **Fatal**: Critical application errors requiring page refresh

### 2. User Communication
- Use clear, non-technical language
- Provide actionable solutions
- Indicate automatic vs. manual recovery

### 3. Logging Strategy
```typescript
// Production logging
console.error('VANA connection failed:', {
  error: error.message,
  code: error.code,
  attempt: reconnectAttempts,
  timestamp: Date.now()
});

// Development logging
console.warn('Retryable error occurred:', error);
```

### 4. Graceful Degradation
- Always provide fallback functionality
- Maintain core features during partial failures
- Clear indication of reduced functionality

## Monitoring and Metrics

Track key error metrics:
- Connection failure rate
- Retry success rate
- Time to recovery
- Fallback activation frequency
- User error interaction rate

## Future Enhancements

1. **Smart Retry Logic**: ML-based retry timing
2. **Error Prediction**: Proactive error detection
3. **Offline Support**: Cached responses during network issues
4. **Performance Monitoring**: Real-time error rate tracking
5. **A/B Testing**: Different error handling strategies