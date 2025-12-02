# Utility Functions

This directory contains utility functions used throughout the application.

## Files

### accessibility.ts
Utility functions for accessibility features, including focus management and ARIA helpers.

### performance.ts
Performance optimization utilities for lazy loading, code splitting, and resource management.

### database-verification.ts
Database health check utilities for verifying critical database triggers and configurations.

#### Key Functions:

- `verifyUserProfileTrigger()`: Checks if the user profile creation trigger exists
- `performStartupDatabaseChecks()`: Runs all database verification checks on app startup

**Usage:**
```typescript
import { performStartupDatabaseChecks } from './utils/database-verification';

// In App.tsx or main.tsx
useEffect(() => {
  performStartupDatabaseChecks();
}, []);
```

**Manual Verification:**
For detailed instructions on manually verifying database triggers, see:
`docs/TRIGGER_VERIFICATION_GUIDE.md`

**Related:**
- Design: `.kiro/specs/user-profile-auto-sync/design.md`
- Requirements: `.kiro/specs/user-profile-auto-sync/requirements.md`
- Task: Requirement 3.4 - Startup verification check
