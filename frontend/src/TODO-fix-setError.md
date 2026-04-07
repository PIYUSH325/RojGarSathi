# Fix setError is not a function Runtime Error

## Steps:
- [x] 1. Create this TODO.md 
- [x] 2. Edit `src/components/ConversationList.jsx`: 
  - Add `useAuth()` import/use
  - Safe destructure `setError = () => {}`
  - Add null-check to error close onClick
- [x] 3. Edit `src/components/ChatWindow.jsx`:
  - Safe destructure `setError = () => {}`
  - Null-check error close onClick
- [ ] 4. Test: Navigate to /messages, trigger error (logout/login?), verify close button works
- [ ] 5. Complete task
