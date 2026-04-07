# ESLint & Compilation Fixes TODO

## Progress Tracking (0/28 complete)

### 1. Fix compilation errors (1/1)
- [x] src/components/ConversationList.jsx: Remove duplicate import, unused vars, fix deps ✓

### 2. Fix context unused code (3/3)
- [x] src/context/AuthContext.jsx: Remove handleAuthResponse ✓
- [x] src/context/ChatContext.jsx: Remove unused useEffect import, API_BASE ✓
- [x] src/context/JobChatContext.jsx: Remove unused imports/vars ✓

### 3. Fix components unused vars (8/8)
- [x] src/components/AdminSidebar.jsx ✓
- [x] src/components/ChatInput.jsx ✓
- [x] src/components/ChatMessage.jsx ✓
- [x] src/components/ChatWindow.jsx ✓
- [x] src/components/EmployerSidebar.jsx ✓
- [x] src/components/FeaturedJobs.jsx ✓
- [x] src/components/ContactForm.jsx ✓

### 4. Fix exhaustive-deps in pages (16/16)
- [x] src/pages/AdminReports.jsx ✓
- [x] src/pages/EmployerAnalytics.jsx ✓
- [x] src/pages/EmployerDashboard.jsx ✓
- [ ] src/pages/EmployerJobs.jsx
- [ ] src/pages/EmployerSettings.jsx
- [x] src/pages/Home.jsx ✓
- [ ] src/pages/JobChatWindow.jsx
- [ ] src/pages/MyApplications.jsx
- [ ] src/pages/AdminSettings.jsx
- [ ] src/pages/Chat.jsx
- [ ] src/pages/Jobs.jsx
- [ ] src/pages/Login.jsx (unused)
- [ ] src/pages/Register.jsx (unused)
- [ ] src/pages/ResetPassword.jsx (unused)
- [x] src/components/SearchBar.jsx ✓
- [x] src/components/ConversationList.jsx useEffect ✓

### 5. Final verification (0/1)
- [ ] Run `npm start`, confirm 0 errors/warnings

**Next:** Fix compilation blocker first, then contexts, then systematic component/page fixes.

