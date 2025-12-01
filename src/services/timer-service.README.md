# Timer Service

The Timer Service manages exam timing and auto-submission for the exam modes system.

## Features

- **Configuration Lookup**: Retrieves timer durations from database with fallback hierarchy
- **Countdown Timer**: Accurate countdown with localStorage persistence
- **Pause/Resume**: Support for pausing and resuming timers
- **State Recovery**: Restores timer state after page reload
- **Auto-submit**: Triggers callback when timer expires

## Usage

### Get Timer Duration

```typescript
import { timerService } from './services/timer-service';

// Get duration for JAMB exam
const duration = await timerService.getDuration({ examType: 'JAMB' });

// Get duration for specific subject
const mathDuration = await timerService.getDuration({
  examType: 'JAMB',
  subjectSlug: 'mathematics'
});

// Get duration for specific year
const yearDuration = await timerService.getDuration({
  examType: 'WAEC',
  year: 2023
});
```

### Start Timer

```typescript
const handle = timerService.startTimer(
  3600, // duration in seconds
  (remaining) => {
    console.log(`Time remaining: ${remaining}s`);
    // Update UI with remaining time
  },
  () => {
    console.log('Timer expired!');
    // Auto-submit quiz
  }
);
```

### Control Timer

```typescript
// Pause timer
handle.pause();

// Resume timer
handle.resume();

// Get remaining time
const remaining = handle.getRemaining();

// Stop timer
handle.stop();
// or
timerService.stopTimer(handle);
```

### Restore Timer After Page Reload

```typescript
const remaining = timerService.restoreTimer();

if (remaining !== null) {
  // Timer is still active, restart it
  const handle = timerService.startTimer(remaining, onTick, onExpire);
}
```

### Format Time Display

```typescript
const formatted = timerService.formatTime(3665); // "61:05"
```

## Configuration Hierarchy

The service looks up timer configurations in the following order:

1. **Most Specific**: exam_type + subject + year
2. **Subject-Specific**: exam_type + subject
3. **Year-Specific**: exam_type + year
4. **Default**: exam_type only

If no configuration is found in the database, it falls back to hardcoded defaults:
- JAMB: 2100 seconds (35 minutes)
- WAEC: 3600 seconds (60 minutes)

## Database Schema

The timer configurations are stored in the `timer_configurations` table:

```sql
CREATE TABLE timer_configurations (
  id UUID PRIMARY KEY,
  exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC')),
  subject_slug TEXT,
  year INTEGER,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(exam_type, subject_slug, year)
);
```

## Admin Functions

### Get All Configurations

```typescript
const configs = await timerService.getAllConfigurations();
```

### Create/Update Configuration

```typescript
await timerService.upsertConfiguration({
  examType: 'JAMB',
  subjectSlug: 'mathematics',
  year: 2024,
  durationSeconds: 2400 // 40 minutes
});
```

## Testing

The service includes comprehensive unit tests covering:
- Duration lookup with fallback
- Timer countdown and callbacks
- Pause/resume functionality
- State persistence and recovery
- Time formatting

Run tests with:
```bash
npm test -- src/services/timer-service.test.ts --run
```
