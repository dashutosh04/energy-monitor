const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs").promises;
const mysql = require("mysql");

const app = express();
const PORT = 25600;

app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
  host: "",
  user: "",
  password: "",
  database: "",
};

const db = mysql.createConnection(dbConfig);

let latestData = null;

db.connect(async (err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS energy_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      voltage DECIMAL(6, 2),
      current DECIMAL(6, 3),
      power INT,
      energy DECIMAL(8, 4),
      cost DECIMAL(8, 4)
    );
  `;

  db.query(createTableQuery, (createTableErr) => {
    if (createTableErr) {
      console.error("Error creating table:", createTableErr);
    } else {
      console.log("Table 'energy_data' created or already exists");
    }
  });

  try {
    const fileContent = await fs.readFile("data.json", "utf8");
    latestData = JSON.parse(fileContent);
    console.log("Initial latest data loaded from data.json:", latestData);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("data.json not found, starting with no initial data.");
    } else {
      console.error("Error reading data.json on startup:", error);
    }
  }
});

app.post("/api/uploadData", async (req, res) => {
  const data = req.body;
  console.log("Received Data:", data);

  latestData = data;

  try {
    await fs.writeFile("data.json", JSON.stringify(latestData), {
      encoding: "utf8",
    });
    console.log("data.json updated with latest data:", latestData);
  } catch (err) {
    console.error("Error writing to data.json:", err);
  }

  const insertQuery = `
    INSERT INTO energy_data (voltage, current, power, energy, cost)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(
    insertQuery,
    [data.voltage, data.current, data.power, data.energy, data.cost],
    (dbErr, results) => {
      if (dbErr) {
        console.error("Error inserting data into MySQL:", dbErr);
        return res
          .status(500)
          .send({ message: "Error storing data in database." });
      } else {
        console.log("Data inserted into MySQL:", results);
        res
          .status(200)
          .send({ message: "Data received and updated successfully!" });
      }
    }
  );
});

app.get("/api/realtime", (req, res) => {
  if (latestData) {
    res.status(200).json(latestData);
  } else {
    res.status(404).send({ message: "No data received yet." });
  }
});

app.get("/api/history", (req, res) => {
  const selectQuery = "SELECT * FROM energy_data ORDER BY timestamp DESC";
  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error fetching data from MySQL:", err);
      res
        .status(500)
        .send({ message: "Error fetching data history from database" });
      return;
    }
    res.status(200).json(results);
  });
});

app.get("/", (req, res) => {
  res.send(
    "ESP32 Data Receiver Server is Running with Realtime and MySQL Tracking"
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on Port: ${PORT}`);
});
