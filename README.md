# ⚡ ESP32 Energy Monitor with Web Dashboard & SMS Alerts 📱

This project implements a comprehensive energy monitoring system using an ESP32 microcontroller. It measures real-time voltage, current, and power, calculates accumulated energy consumption and cost, displays the data on a web dashboard and a local LCD, stores historical data in a database, and sends SMS alerts via Twilio when power consumption exceeds a defined threshold.

## ✨ Features

- **Real-time Monitoring:** 📊 Measures Voltage (V), Current (A), and Power (W).
- **Energy & Cost Calculation:** 💰 Calculates accumulated Energy (kWh) and estimated Cost based on a configurable rate.
- **Web Dashboard:** 🖥️ A responsive web interface displaying real-time metrics using interactive gauges (Voltage, Current, Power, Energy, Cost).
- **Data Persistence:** 💾 Stores accumulated energy and cost values on the ESP32's EEPROM to survive reboots.
- **Database Logging:** 🗄️ Logs historical energy data (Timestamp, V, A, W, kWh, Cost) to a MySQL database via a Node.js API.
- **SMS Alerts:** ⚠️ Sends SMS notifications using Twilio when power consumption surpasses a predefined threshold.
- **Local Display:** 📟 Shows key metrics on an attached I2C LCD screen.
- **Blynk Integration:** Sends data to the Blynk mobile app (requires Blynk configuration).

## 🛠️ Project Components

1.  **Hardware (ESP32 - `energy-monitor.ino`)**

    - Microcontroller: ESP32
    - Sensors: Voltage Sensor (e.g., ZMPT101B module - _calibration required_), Current Sensor (ACS712 20A module - _calibration required_) 🔌
    - Display: I2C LCD Display (16x2)
    - Input: Push Button (for clearing stored data or switching LCD screens)🔘
    - Connectivity: Requires WiFi connection 📶

2.  **Backend API Server (`index.js`)**

    - Technology: Node.js/Express application ⚙️
    - Functionality: Receives data from ESP32 via HTTP POST (`/api/uploadData`), stores data in MySQL (`energy_data` table), provides API endpoints (`/api/realtime`, `/api/history`), persists latest reading to `data.json`.

3.  **Frontend & Alert Server (`server.js`, `public/`)**
    - Technology: Node.js/Express application ⚙️
    - Functionality: Serves the static web dashboard (`public/`), fetches real-time data from Backend API, monitors wattage, triggers Twilio SMS alerts.

## 🔄 Architecture / Workflow

1.  **ESP32:** Measures V, I, P -> Calculates Energy & Cost -> Stores in EEPROM -> Sends data via HTTP POST to Backend API -> Sends to Blynk -> Displays on LCD.
2.  **Backend API Server:** Receives data -> Stores in MySQL -> Updates `data.json` -> Serves data via API endpoints.
3.  **Frontend & Alert Server:** Serves HTML/CSS/JS -> Frontend JS fetches data from API -> Updates dashboard gauges -> Backend JS fetches data from API -> Checks threshold -> Sends SMS alert if needed.

## ⚙️ Software Setup & Configuration

**1. ESP32 (`energy-monitor.ino`)**

- **IDE:** Arduino IDE
- **Libraries:** `WiFi`, `EmonLib`, `EEPROM`, `BlynkSimpleEsp32`, `Wire`, `LiquidCrystal_I2C`, `HTTPClient`. (Install via Library Manager or manually).
- **Configuration:** Update placeholders in `energy-monitor.cpp`:
  - Blynk details (if used)
  - `wifiSsid[]`, `wifiPass[]` 📶
  - `endpointUrl` (URL of your Backend API Server, e.g., `http://<your_api_server_ip>/api/uploadData`) 🔗
  - `voltageCal`, `currentCal` (**Crucial!** Calibrate accurately!) ⚖️
  - `pricePerKwh` 💲
  - Hardware Pins (I2C, LCD, Button, Sensors) - Adjust if needed.

**2. Backend API Server (`index.js`)**

- **Requirements:** Node.js, npm, MySQL Server 📦.
- **Installation:**
  ```bash
  cd /path/to/backend-api-directory
  npm install express body-parser cors mysql fs
  ```
- **Database Setup:**
  - Ensure MySQL server is running.
  - Create a database (e.g., `energy_monitor_db`).
  - The server attempts to create the `energy_data` table automatically.
- **Configuration:**
  - Update `dbConfig` in `index.js` with MySQL details (host, user, password, database).
  - (Recommended) Use a `.env` file for credentials.
- **Running:**
  ```bash
  node index.js
  ```
  _(Consider using `pm2` for production)_

**3. Frontend & Alert Server (`server.js`, `public/`)**

- **Requirements:** Node.js, npm, Twilio Account 📦.
- **Installation:**
  ```bash
  cd /path/to/frontend-alert-directory
  npm install express dotenv twilio
  # Ensure index.html, script.js, styles.css are in a 'public' subdirectory
  mkdir public
  mv index.html script.js styles.css public/
  ```
- **Configuration:**

  - Create a `.env` file in this directory:

    ```dotenv
    # Server Port
    PORT=12345

    # Twilio Credentials
    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    TWILIO_AUTH_TOKEN=your_auth_token
    TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
    RECEIVER_PHONE_NUMBER=+1yyyyyyyyyy


    API_ENDPOINT=http://<your_api_server_ip>/api/realtime

    # Alert Threshold (in Watts)
    ALERT_THRESHOLD=1000
    ```

  - Ensure `fetch` URL in `public/script.js` points to your Backend API server (`http://<your_api_server_ip>/api/realtime`).

- **Running:**
  ```bash
  node server.js
  ```
  _(Consider using `pm2`)_

## ▶️ Running the Project

1.  **Hardware Setup:** Wire components correctly 🔌.
2.  **Database Setup:** Configure MySQL 🗄️.
3.  **Start Backend API Server:** `node index.js` ▶️.
4.  **Start Frontend & Alert Server:** `node server.js` ▶️.
5.  **Flash ESP32:** Configure and upload `energy-monitor.ino` ⚡.
6.  **Monitor:** Check Serial Monitor, LCD 📟, Blynk, and the Web Dashboard (`http://<frontend_server_ip>`) 🖥️.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 📜 License

This project is licensed under the MIT License.
