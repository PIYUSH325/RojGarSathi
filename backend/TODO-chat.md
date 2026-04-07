# Backend TODO: Fix Chat 401 for Public Access
1. chatRoutes.js: Make GET /chat/conversations, /chat/conversation/:jobId public (no auth middleware)
2. socketIO.js: Optional token validation (allow anonymous room join by jobId)
3. Test: Anonymous /chat/:jobId → loads job + empty chat
