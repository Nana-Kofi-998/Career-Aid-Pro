# Tab Navigation Troubleshooting Guide

## Problem Summary
Tabs were not updating their active state when clicked. Only Dashboard showed as active regardless of which tab was selected.

## Root Cause Analysis
The bug was in `MobileNav.tsx` line 32:

```tsx
// BEFORE (Bug):
export default function MobileNav({ isKid }: MobileNavProps = {}) {

// The default parameter {} is truthy in JavaScript!
// This caused the component to always treat isKid as true,
// using kidTabs instead of mainTabs, and preventing proper route matching.
```

## Fixes Applied

### 1. MobileNav.tsx (Line 32)
```diff
- export default function MobileNav({ isKid }: MobileNavProps = {}) {
+ export default function MobileNav({ isKid = false }: MobileNavProps) {
```

### 2. Layout.tsx (Line 187)
```diff
- <MobileNav />
+ <MobileNav isKid={isKid} />
```

## Debugging Steps

### Step 1: Check React Router NavLink isActive
Verify that the `isActive` prop from NavLink is working:
```tsx
<NavLink
  to="/chat"
  className={({ isActive }) => 
    isActive ? "bg-emerald-500" : "bg-slate-500"
  }
>
  Chat
</NavLink>
```

### Step 2: Verify Route Matching
Check if the route paths match exactly:
- `/dashboard` - Dashboard
- `/chat` - Chat
- `/cv-tools/cv-builder` - CV Tools
- `/personality` - Personality
- `/settings` - Settings

### Step 3: Check Props Flow
Trace props from App → Layout → MobileNav:
1. App.tsx passes `isKid={user?.age < 13}` to Layout
2. Layout receives `isKid` and passes to MobileNav
3. MobileNav uses `isKid` to select correct tabs

### Step 4: Verify Tab Configuration Arrays
Ensure tabs exist for each route:
```tsx
const mainTabs = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/cv-tools/cv-builder", label: "CV Tools", icon: FileText },
  { to: "/personality", label: "Personality", icon: Sparkles },
  { to: "/settings", label: "More", icon: Settings },
];
```

## Common Pitfalls

### 1. Truthy Default Values
```jsx
// BAD - {} is truthy!
function Component({ flag }: Props = {}) {
  flag ? "yes" : "no" // Always "yes" if not passed
}

// GOOD
function Component({ flag = false }: Props) {
  flag ? "yes" : "no" // Correctly "no" when not passed
}
```

### 2. Missing Props in Child Components
```jsx
// BAD - props not forwarded
<Child />

// GOOD - props explicitly passed
<Child isKid={isKid} />
```

### 3. Route Path Mismatches
```tsx
// Ensure tab 'to' matches route paths exactly
{ to: "/cv-tools/cv-builder", label: "CV Tools" }  // Correct
{ to: "/cv-builder", label: "CV Tools" }          // Wrong - back-compat only
```

## Testing Checklist
- [ ] Click Dashboard - shows active state
- [ ] Click Chat - shows active state
- [ ] Click CV Tools - shows active state
- [ ] Click Personality - shows active state
- [ ] Click Settings - shows active state
- [ ] Verify both desktop sidebar and mobile nav work correctly
- [ ] Verify kid mode shows correct tabs (no CV Tools)