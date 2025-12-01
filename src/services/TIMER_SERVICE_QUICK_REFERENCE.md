# Timer Service Quick Reference

## Import
```typescript
import { timerService } from '@/services/timer-service';
```

## Get Duration
```typescript
// Basic usage
const duration = await timerService.getDuration({ examType: 'JAMB' });

// With subject
const duration = await timerService.getDuration({ 
  examType: 'JAMB', 
  subjectSlug: 'mathematics' 
});

// With year
const duration = await timerService.getDuration({ 
  examType: 'WAEC', 
  year: 2023 
});
```

## Start Timer
```typescript
const handle = timerService.startTimer(
  3600, // duration in seconds
  (remaining) => {
    // Called every second
    setTimeRemaining(remaining);
  },
  () => {
    // Called when timer expires
    handleAutoSubmit();
  }
);
```

## Control Timer
```typescript
handle.pause();           // Pause countdown
handle.resume();          // Resume countdown
const remaining = handle.getRemaining();  // Get remaining seconds
handle.stop();            // Stop and cleanup
```

## Restore After Reload
```typescript
useEffect(() => {
  const remaining = timerService.restoreTimer();
  if (remaining) {
    // Timer was active, restart it
    const handle = timerService.startTimer(remaining, onTick, onExpire);
  }
}, []);
```

## Format Display
```typescript
const formatted = timerService.formatTime(3665); // "61:05"
```

## Cleanup
```typescript
timerService.clearPersistedTimer(); // Clear localStorage
```

## Default Durations
- **JAMB**: 2100s (35 minutes)
- **WAEC**: 3600s (60 minutes)

## Configuration Hierarchy
1. exam_type + subject + year (most specific)
2. exam_type + subject
3. exam_type + year
4. exam_type (default)
5. Hardcoded fallback
