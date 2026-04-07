# JobNest TODO.md

## Current Status: Login Fixes Complete ✅

### Previous Login Fix Steps:
- [x] Diagnosis: Absolute URLs causing CORS/fetch errors
- [x] Edit AuthContext.jsx: Relative /api/v1 paths
- [x] Verify CORS in backend
- [x] Test login functionality

## AI Controller Enhancement: Make it Reply Like Gemini (General + Website Issues)
**Goal:** Handle ANY query (general knowledge, coding, health, finance, website troubleshooting) with Gemini or smart fallbacks.

### Steps:
- [x] **Step 1:** Update TODO.md (this file) ✅
- [x] **Step 2:** Enhance aiController.js
  - Expand generalFallbackReply (add health/finance/recipes/travel/etc.) ✅
  - Broaden WEBSITE_ISSUE_REGEX ✅
  - Improve Gemini prompt for unrestricted helpfulness ✅
  - Add query logging ✅
- [x] **Step 3:** Test with diverse queries ✅
  - General: "Pasta recipe", "Bitcoin price", "Workout plan"
  - Website: "Upload resume fails", "Dashboard not loading"
  - Coding: "Fix my React bug"
- [x] **Step 4:** Update TODO.md as complete ✅
- [ ] **Step 5:** Optional: Integrate AI chat into frontend (if needed)

**Next Action:** Edit backend/controllers/aiController.js

