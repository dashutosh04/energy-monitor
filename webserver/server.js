const express = require("express");
require("dotenv").config();
const path = require("path");
const app = express();
const port = process.env.PORT || 25623;

const THRESHOLD = 1000;
let alertSent = false;

const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const senderPhone = process.env.TWILIO_PHONE_NUMBER;
const receiverPhone = process.env.RECEIVER_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://domain.name:${port}`);
});

async function checkWattageAndNotify() {
  try {
    const response = await fetch("http://domain.name:port/api/realtime");
    const data = await response.json();
    const wattage = data.power;
    console.log(
      `[${new Date().toLocaleTimeString()}] Current wattage: ${wattage}W`
    );

    if (wattage > THRESHOLD && !alertSent) {
      await client.messages.create({
        body: `⚠️ Alert: Wattage exceeded 1000W. Current wattage: ${wattage.toFixed(
          2
        )}W.`,
        from: senderPhone,
        to: receiverPhone,
      });
      console.log("✅ SMS sent.");
      alertSent = true;
    }
    if (wattage <= THRESHOLD && alertSent) {
      console.log("ℹ️ Wattage back under threshold. Resetting alert.");
      alertSent = false;
    }
  } catch (error) {
    console.error("❌ Error during wattage check or SMS send:", error);
  }
}

setInterval(checkWattageAndNotify, 5000);

checkWattageAndNotify();
