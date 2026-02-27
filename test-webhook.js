#!/usr/bin/env node

/**
 * test-webhook.js
 * 
 * Quick webhook testing script for LINE
 * Works on Windows, macOS, and Linux
 * 
 * Usage:
 *   node test-webhook.js          (test localhost)
 *   node test-webhook.js <url>    (test specific URL)
 * 
 * Example:
 *   node test-webhook.js http://localhost:3000
 *   node test-webhook.js https://abc123.ngrok.io
 */

const crypto = require("crypto");
const https = require("https");
const http = require("http");

// Get command line arguments
const args = process.argv.slice(2);
const baseUrl = args[0] || "http://localhost:3000";
const channelSecret = process.env.LINE_CHANNEL_SECRET || "your_secret_here";

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║              LINE WEBHOOK TEST UTILITY                     ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// Sample webhook payload
const payload = {
  destination: "Cxyz1234567890abcdef1234567890ab",
  events: [
    {
      type: "message",
      source: {
        type: "user",
        userId: "Uxyz1234567890abcdef1234567890ab",
      },
      message: {
        type: "text",
        id: "100000001",
        text: "Hello from webhook test script!",
      },
      timestamp: Date.now(),
      replyToken: "00000000000000000000000000000000",
    },
  ],
};

const payloadJson = JSON.stringify(payload);

// Calculate HMAC-SHA256 signature
const signature = crypto
  .createHmac("sha256", channelSecret)
  .update(payloadJson)
  .digest("base64");

console.log("📋 Test Configuration:");
console.log(`   URL: ${baseUrl}/api/line/webhook`);
console.log(`   Method: POST`);
console.log(`   Channel Secret: ${channelSecret === "your_secret_here" ? "⚠️  NOT SET" : "✅ Configured"}`);
console.log(`   Signature: ${signature.substring(0, 30)}...`);
console.log("");

console.log("📄 Payload:");
console.log(`   Destination: ${payload.destination}`);
console.log(`   Events: ${payload.events.length}`);
console.log(`   User ID: ${payload.events[0].source.userId}`);
console.log(`   Message: "${payload.events[0].message.text}"`);
console.log("");

console.log("🚀 Sending test webhook...\n");

// Parse URL
const url = new URL(`${baseUrl}/api/line/webhook`);
const protocol = url.protocol === "https:" ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === "https:" ? 443 : 80),
  path: url.pathname + url.search,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payloadJson),
    "X-Line-Signature": signature,
  },
};

const request = protocol.request(options, (response) => {
  let data = "";

  response.on("data", (chunk) => {
    data += chunk;
  });

  response.on("end", () => {
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`✅ Response Status: ${response.statusCode} ${response.statusMessage}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    console.log("📊 Response Headers:");
    Object.entries(response.headers).forEach(([key, value]) => {
      if (["content-type", "content-length", "date"].includes(key.toLowerCase())) {
        console.log(`   ${key}: ${value}`);
      }
    });
    console.log("");

    console.log("📄 Response Body:");
    try {
      const jsonResponse = JSON.parse(data);
      console.log(`   ${JSON.stringify(jsonResponse, null, 2)
        .split("\n")
        .join("\n   ")}`);
    } catch {
      console.log(`   ${data}`);
    }
    console.log("");

    // Check response
    if (response.statusCode === 200) {
      console.log("✅ WEBHOOK TEST SUCCESSFUL!");
      console.log("");
      console.log("Next steps:");
      console.log("  1. Check your admin UI: http://localhost:3000/chat");
      console.log("  2. The message should appear from user: " + payload.events[0].source.userId);
      console.log("  3. Check real-time updates in other admin browser tabs");
    } else if (response.statusCode === 401) {
      console.log("⚠️  SIGNATURE VERIFICATION FAILED");
      console.log("");
      console.log("Common causes:");
      console.log("  1. LINE_CHANNEL_SECRET is incorrect");
      console.log("  2. Payload was modified before sending");
      console.log("");
      console.log("Fix:");
      console.log("  export LINE_CHANNEL_SECRET=your_real_secret_from_line_console");
      console.log("  node test-webhook.js");
    } else if (response.statusCode === 500) {
      console.log("❌ SERVER ERROR");
      console.log("");
      console.log("Check your terminal logs for detailed error messages");
    } else {
      console.log(`⚠️  Unexpected status: ${response.statusCode}`);
    }

    process.exit(response.statusCode === 200 ? 0 : 1);
  });
});

request.on("error", (error) => {
  console.log(`❌ Connection Error: ${error.message}`);
  console.log("");
  console.log("Troubleshooting:");
  
  if (error.code === "ECONNREFUSED") {
    console.log("  • Dev server is not running");
    console.log("  • Start it with: npm run dev");
    if (baseUrl.includes("ngrok")) {
      console.log("  • OR ngrok tunnel is not running");
      console.log("  • Start it with: ngrok http 3000");
    }
  } else if (error.code === "ENOTFOUND") {
    console.log("  • Invalid URL or hostname");
    console.log("  • Check the URL: " + baseUrl);
  } else {
    console.log(`  • ${error.code}: ${error.message}`);
  }
  
  process.exit(1);
});

// Send the request
request.write(payloadJson);
request.end();

// Timeout after 10 seconds
setTimeout(() => {
  console.log("❌ Request timed out after 10 seconds");
  process.exit(1);
}, 10000);
