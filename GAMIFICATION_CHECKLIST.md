# Gamification System Integration Checklist

Use this checklist to ensure proper integration of the gamification system into your Vorex mobile app.

## Quick Start - 3 Essential Steps

### ✅ Step 1: Add Provider (REQUIRED)
```typescript
// In App.tsx
import { GamificationProvider } from './src/context/GamificationContext';

<GamificationProvider>
  {/* Your app */}
</GamificationProvider>
```

### ✅ Step 2: Track Actions (REQUIRED)
```typescript
// In your lesson/conversation screens
import { useGamification } from './src/context/GamificationContext';

const { completeLesson, addPracticeTime } = useGamification();

completeLesson(); // Awards 50 XP
addPracticeTime(10); // 10 minutes
```

### ✅ Step 3: Display UI (RECOMMENDED)
```typescript
// In your home screen
import { XPBar, StreakBadge } from './src/components';

<XPBar showXPNumbers={true} />
<StreakBadge showDetails={true} />
```

## Full Integration Checklist

See full checklist at:
- Complete API docs: `/src/context/GAMIFICATION_README.md`
- Integration guide: `/GAMIFICATION_INTEGRATION.md`
- Architecture: `/GAMIFICATION_ARCHITECTURE.md`

## Files Created

- [x] `/src/context/GamificationContext.tsx`
- [x] `/src/data/achievements.ts`
- [x] `/src/components/XPBar.tsx`
- [x] `/src/components/StreakBadge.tsx`
- [x] `/src/components/AchievementToast.tsx`
- [x] `/src/components/AchievementsList.tsx`
- [x] `/src/screens/AchievementsScreen.tsx`

## Testing

Basic test:
```typescript
const { addXP, state } = useGamification();
addXP(100, 'test');
console.log('XP:', state.xp, 'Level:', state.level);
```

## Troubleshooting

**"useGamification must be used within a GamificationProvider"**
→ Wrap your app with GamificationProvider

**State not persisting**
→ Check AsyncStorage permissions

**Achievements not unlocking**
→ Call checkAndUnlockAchievements() or use helper methods like completeLesson()

---

For detailed instructions, see `/GAMIFICATION_INTEGRATION.md`
