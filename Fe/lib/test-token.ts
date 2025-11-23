// lib/test-token.ts
// Script để test token - chạy trong browser console

export async function testToken() {
  const token = localStorage.getItem("accessToken");
  
  if (!token) {
    console.error("❌ No token found! Please login first.");
    return;
  }

  console.log("🔍 Testing token...");
  console.log("Token preview:", token.substring(0, 30) + "...");

  // Test với Inventory Service
  try {
    const res = await fetch("http://localhost:4001/test-token", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    
    if (res.ok) {
      console.log("✅ Token is VALID!");
      console.log("Payload:", data.payload);
      console.log("Secret used:", data.secretUsed);
    } else {
      console.error("❌ Token is INVALID!");
      console.error("Error:", data.error);
      console.error("Secret used:", data.secretUsed);
      
      if (data.error.includes("expired")) {
        console.log("💡 Token has expired. Please login again.");
      } else if (data.error.includes("secret")) {
        console.log("💡 JWT_ACCESS_SECRET mismatch between services.");
        console.log("   Make sure both Auth Service and Inventory Service use the SAME secret.");
      }
    }
  } catch (err) {
    console.error("❌ Network error:", err);
    console.log("💡 Make sure Inventory Service is running on port 4001");
  }
}

// Auto-run if in browser console
if (typeof window !== "undefined") {
  (window as any).testToken = testToken;
  console.log("💡 Run testToken() in console to test your token");
}

