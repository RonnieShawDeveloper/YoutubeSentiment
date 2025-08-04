# Dashboard Reports Loading Fix

## Issue
When a user signs in and the dashboard is shown, reports do not appear immediately. The user has to click the refresh button to make the reports show up. This happens because reports are not loading properly on dashboard startup.

## Root Cause
The issue was in the `DashboardComponent` initialization sequence:

1. In `ngOnInit()`, the component was calling `loadUserProfile()` and then immediately calling `loadReports()`.
2. The `loadReports()` method depends on `userProfile` being available to fetch the user's reports.
3. Since `userProfile` is loaded asynchronously via a subscription to `userProfile$` in the `loadUserProfile()` method, the `loadReports()` method was often executing before `userProfile` was populated.
4. When `loadReports()` ran without a valid `userProfile`, it couldn't fetch any reports, resulting in an empty reports list.
5. When the user clicked the refresh button, `loadReports()` was called again, but by that time `userProfile` was available, so the reports loaded successfully.

## Solution
The fix ensures that reports are loaded only after the user profile is available:

1. Removed the direct call to `loadReports()` from `ngOnInit()`.
2. Modified the `loadUserProfile()` method to call `loadReports()` only after the user profile is available:

```
loadUserProfile(): void {
  this.userSubscription = this.firebaseService.userProfile$.subscribe(profile => {
    this.userProfile = profile;
    if (profile) {
      this.loadReports();
    }
  });
}
```

This change ensures that reports are loaded automatically when the user profile becomes available, without requiring the user to click the refresh button.

## Benefits
- Reports now load automatically when the dashboard is first displayed
- Improved user experience as users don't need to manually refresh to see their reports
- More predictable application behavior

## Testing
The fix has been tested by simulating the user sign-in flow and verifying that reports load automatically when the dashboard is displayed.
