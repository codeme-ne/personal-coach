# Lukas Habit Tracker

## Scope

- [x] Add a daily habit
- [x] Track habit completion for the day
- [x] View habit history
- [x] See current streak
- [ ] Edit / delete habits (UI wired; refine real todo deletion)

## Tech Stack

- React Native
- Expo
- TypeScript
- Firebase

## Completed Milestones

- Custom bottom navigation with FAB
- Settings screen scaffold
- Habit add modal + FAB trigger
- UI / accessibility refinements
- Workaround for Firestore index errors (client-side filtering)

## Outstanding / Next Session

- Fix real Firestore todo deletion (web + mobile)
- Replace any test toggle with production data flow
- Add proper Firestore composite indexes (restore efficient queries)
- Verify Firestore security rules for delete
- Add error + loading states for deletion
- Remove global modal handler (introduce context/provider)
- Write unit tests for habit & todo services

## Issues / TODO

- [ ] Reliable Firestore deletion of todos (web)
- [ ] Reintroduce indexed queries after creating Firestore indexes
- [ ] Improve state management (context or Zustand)
- [ ] Audit accessibility (labels, roles)

Good to know: Ich greife auf Expo übers Web zu.
