// Run with: node fetch-api.js
import fetch from "node-fetch"; // npm install node-fetch

const link = "https://0bea512690fc.ngrok-free.app";
// const NGROK_URL = link + "/api/docs/"; // replace with the endpoint you want
// const NGROK_URL = link + "/api/search/?query=drizzy8"; // replace with the endpoint you want
const NGROK_URL = link + "/api/stream/YZj-HRNun2o?stream=1"; // replace with the endpoint you want

async function testEndpoint() {
  try {
    const res = await fetch(NGROK_URL, {
      method: "GET",
      // Don't force JSON yet; just let the server decide
      headers: {
        // 'Accept': 'application/json', // comment out for raw test
      },
    });
    console.log("URL Used: ", NGROK_URL);
    console.log("----- RESPONSE INFO -----");
    console.log("Status:", res.status, res.statusText);
    console.log("Headers:");
    res.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log("----- RAW BODY -----");
    const body = await res.text(); // always safe to read as text
    console.log(body);

    // Optionally, try to parse as JSON if it looks like JSON
    try {
      const json = JSON.parse(body);
      console.log("----- Parsed JSON -----");
      console.log(json);
    } catch {
      console.log("(Body is not valid JSON)");
    }
  } catch (err) {
    console.error("❌ Fetch failed:", err);
  }
}

testEndpoint();
