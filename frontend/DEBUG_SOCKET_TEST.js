/**
 * Quick Debug Script to Test Socket Authentication
 * 
 * HOW TO USE:
 * 1. Open DevTools Console (F12)
 * 2. Copy and paste the entire script below into the console
 * 3. Follow the prompts
 * 4. Share the output if there's an error
 */

async function testSocketAuthentication() {
  console.log("=== SOCKET AUTHENTICATION DEBUG TEST ===\n");
  
  // Test 1: Token Storage
  console.log("TEST 1: Checking token storage...");
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.error("❌ FAIL: No token found in storage");
    console.log("   Action: Please log in first, then run this script again");
    return;
  }
  console.log(`✅ PASS: Token found (length: ${token.length})`);
  console.log(`   First 30 chars: ${token.substring(0, 30)}...`);
  console.log(`   Starts with quote: ${token[0] === '"' ? "⚠️ YES (has quotes)" : "✅ NO (clean)"}`);
  console.log(`   Starts with Bearer: ${token.startsWith('Bearer') ? "⚠️ YES (has Bearer)" : "✅ NO (clean)"}`);
  
  // Test 2: Socket Initialization
  console.log("\nTEST 2: Checking socket initialization...");
  if (!window.socketClient) {
    console.error("❌ FAIL: socketClient not found in window object");
    console.log("   Note: This is normal if on login page. Navigate to chat first.");
    return;
  }
  console.log("✅ PASS: socketClient module loaded");
  
  // Test 3: Socket Instance
  console.log("\nTEST 3: Checking socket instance...");
  try {
    const socket = window.socketClient.getSocket?.();
    if (!socket) {
      console.warn("⚠️ WARNING: Socket instance not yet created");
      console.log("   Action: Open a chat conversation to initialize socket");
      return;
    }
    console.log("✅ PASS: Socket instance exists");
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Connected: ${socket.connected ? "✅ YES" : "❌ NO"}`);
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    return;
  }
  
  // Test 4: Socket Authentication
  console.log("\nTEST 4: Checking socket authentication...");
  const socket = window.socketClient.getSocket?.();
  if (!socket.connected) {
    console.error("❌ FAIL: Socket not connected");
    console.log("   Action: Wait 2-3 seconds for socket to connect, then try again");
    return;
  }
  console.log("✅ PASS: Socket connected");
  console.log(`   Auth object: ${JSON.stringify(socket.auth)}`);
  
  // Test 5: Socket Ready Status
  console.log("\nTEST 5: Checking if socket is ready to send messages...");
  const isReady = window.socketClient.isSocketReady?.();
  if (!isReady) {
    console.error("❌ FAIL: Socket not ready");
    console.log("   Status:", {
      connected: socket.connected,
      hasAuth: !!socket.auth,
      hasToken: !!socket.auth?.token
    });
    return;
  }
  console.log("✅ PASS: Socket is ready to send messages");
  
  // Test 6: Parse JWT (advanced)
  console.log("\nTEST 6: Decoding JWT token (advanced check)...");
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn("⚠️ WARNING: Token doesn't look like a valid JWT (should have 3 parts)");
      return;
    }
    console.log("✅ PASS: JWT has correct format (3 parts)");
    
    // Try to decode payload
    const payload = JSON.parse(atob(parts[1]));
    console.log("✅ PASS: JWT payload decoded successfully");
    console.log(`   User ID: ${payload.id}`);
    console.log(`   User Role: ${payload.role}`);
    console.log(`   User Email: ${payload.email}`);
    console.log(`   Issued At: ${new Date(payload.iat * 1000).toLocaleString()}`);
    console.log(`   Expires At: ${new Date(payload.exp * 1000).toLocaleString()}`);
    
    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error("❌ FAIL: Token is EXPIRED");
      console.log("   Action: Log out and log back in to get a fresh token");
      return;
    }
    console.log(`   Expires in: ${Math.floor((payload.exp - now) / 60)} minutes`);
  } catch (err) {
    console.error("⚠️ Could not decode JWT:", err.message);
  }
  
  // Final Summary
  console.log("\n=== SUMMARY ===");
  console.log("✅ All checks passed! Socket authentication should work.");
  console.log("\nNext step: Try sending a message in chat.");
  console.log("If you still get 'logged in' error, check:");
  console.log("  1. Backend logs for 'Authenticated' message");
  console.log("  2. Browser Network tab → WS → connection status");
  console.log("  3. If all above look good, JWT_SECRET might not match between login and socket");
}

// Run the test
testSocketAuthentication();
