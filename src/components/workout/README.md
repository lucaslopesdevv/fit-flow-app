# Workout Error Handling and Loading States

This directory contains comprehensive error handling and loading state components for workout operations in the FitFlow app.

## Components Overview

### Error Handling Components

#### `WorkoutErrorBoundary`
A React error boundary specifically designed for workout operations.

**Features:**
- Catches and handles workout-specific errors
- Provides contextual error messages based on error type
- Shows retry button for recoverable errors
- Integrates with the workout error system

**Usage:**
```tsx
<WorkoutErrorBoundary onRetry={handleRetry} fallbackMessage="Custom error message">
  <YourWorkoutComponent />
</WorkoutErrorBoundary>
```

#### `WorkoutErrorMessage`
Displays specific error messages with actionable buttons.

**Features:**
- Different error types with appropriate icons and colors
- Compact and full display modes
- Retry and dismiss actions
- Field-specific error highlighting

**Usage:**
```tsx
<WorkoutErrorMessage
  error={workoutError}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
  compact={true}
/>
```

#### `NetworkErrorFallback` & `EmptyStateFallback`
Specialized fallback components for common scenarios.

### Loading State Components

#### `WorkoutLoading`
General loading indicator for workout operations.

#### `WorkoutCreationLoading`
Specialized loading state for workout creation with progress indication.

#### `WorkoutListLoading`
Skeleton loading state for workout lists with placeholder cards.

#### `WorkoutDetailsLoading`
Skeleton loading state for workout details with exercise placeholders.

#### `WorkoutSavingIndicator`
Overlay loading indicator for save operations.

### Wrapper Components

#### `WorkoutOperationWrapper`
Universal wrapper that handles loading, error, and empty states.

**Features:**
- Automatic state management
- Error boundary integration
- Customizable empty states
- Loading overlays

**Usage:**
```tsx
<WorkoutOperationWrapper
  loading={loading}
  error={error}
  isEmpty={data.length === 0}
  onRetry={handleRetry}
  emptyTitle="No workouts found"
  emptyMessage="Create your first workout"
  emptyActionTitle="Create Workout"
  onEmptyAction={handleCreate}
>
  <YourContent />
</WorkoutOperationWrapper>
```

#### `WorkoutListWrapper`
Specialized wrapper for workout lists with role-based empty states.

#### `WorkoutFormWrapper`
Specialized wrapper for workout forms with saving indicators.

## Hook: `useWorkoutOperations`

A comprehensive hook that provides:

### Features
- **Automatic retry logic** with exponential backoff
- **Form data persistence** during errors
- **Timeout handling** for network operations
- **Error categorization** and handling
- **Operation cancellation** support

### Configuration Options
```tsx
const options = {
  maxRetries: 3,           // Maximum retry attempts
  retryDelay: 1000,        // Base delay between retries (ms)
  timeout: 30000,          // Operation timeout (ms)
  persistFormData: true,   // Enable form persistence
  formStorageKey: 'key'    // Storage key for form data
}

const {
  // State
  loading,
  error,
  retryCount,
  canRetry,
  
  // Operations
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getInstructorWorkouts,
  getStudentWorkouts,
  getWorkoutDetails,
  duplicateWorkout,
  searchInstructorWorkouts,
  
  // Form persistence
  getPersistedFormData,
  clearPersistedFormData,
  
  // Control
  retry,
  cancel,
  clearError
} = useWorkoutOperations(options)
```

### Error Types
The system handles different error types with appropriate responses:

- **`NETWORK_ERROR`**: Connection issues, timeouts - Shows retry option
- **`PERMISSION_ERROR`**: Access denied - No retry, shows explanation
- **`VALIDATION_ERROR`**: Invalid data - No retry, shows field-specific errors
- **`NOT_FOUND_ERROR`**: Resource not found - No retry, suggests alternatives

### Retry Logic
- Automatic retry for network errors
- Exponential backoff (1s, 2s, 4s, etc.)
- Maximum retry limit (configurable)
- Manual retry option for users

### Form Persistence
- Automatically saves form data during errors
- Restores data when user returns
- Expires after 24 hours
- Clears on successful submission

## Timeout Handling

### `withTimeout` Function
Wraps promises with timeout functionality:

```tsx
const result = await withTimeout(
  someAsyncOperation(),
  {
    timeout: 30000,
    timeoutMessage: 'Operation timed out',
    abortController: controller
  }
)
```

### `TimeoutManager` Class
Manages multiple timeouts and abort controllers:

```tsx
const manager = new TimeoutManager()

// Create managed timeout
await manager.withManagedTimeout(
  'operation-key',
  someAsyncOperation(),
  { timeout: 30000 }
)

// Cleanup all timeouts
manager.clearAll()
```

## Integration Examples

### Basic Workout List
```tsx
function WorkoutList() {
  const { getStudentWorkouts, loading, error, retry } = useWorkoutOperations()
  const [workouts, setWorkouts] = useState([])

  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    try {
      const data = await getStudentWorkouts(userId)
      setWorkouts(data)
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <WorkoutListWrapper
      loading={loading}
      error={error}
      workouts={workouts}
      onRetry={retry}
      userRole="student"
    >
      {workouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </WorkoutListWrapper>
  )
}
```

### Workout Form with Persistence
```tsx
function CreateWorkoutForm() {
  const {
    createWorkout,
    loading,
    error,
    getPersistedFormData,
    clearPersistedFormData,
    retry,
    clearError
  } = useWorkoutOperations({
    persistFormData: true,
    formStorageKey: 'create_workout_form'
  })

  const [formData, setFormData] = useState(initialData)

  useEffect(() => {
    // Restore persisted data on mount
    loadPersistedData()
  }, [])

  const loadPersistedData = async () => {
    const persisted = await getPersistedFormData()
    if (persisted) {
      setFormData(persisted)
    }
  }

  const handleSubmit = async () => {
    try {
      await createWorkout(userId, formData)
      await clearPersistedFormData()
      onSuccess()
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <WorkoutFormWrapper
      saving={loading}
      error={error}
      onRetry={retry}
      onErrorDismiss={clearError}
    >
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </WorkoutFormWrapper>
  )
}
```

## Best Practices

1. **Always use wrappers** for consistent error handling
2. **Enable form persistence** for complex forms
3. **Provide specific error messages** for better UX
4. **Use appropriate loading states** for different operations
5. **Handle timeouts** for long-running operations
6. **Test error scenarios** thoroughly
7. **Provide fallbacks** for when data fails to load

## Testing

The error handling system includes:
- Unit tests for error boundary behavior
- Integration tests for retry logic
- Form persistence tests
- Timeout handling tests
- Accessibility tests for error states

## Accessibility

All error and loading components include:
- Proper ARIA labels and roles
- Screen reader announcements
- Keyboard navigation support
- High contrast colors
- Clear visual hierarchy