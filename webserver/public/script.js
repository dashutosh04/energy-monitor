const ARC_LENGTH = 125.663706;

const gaugeConfig = {
  voltage: {
    fillId: "gaugeFillVoltage",
    valueId: "gaugeValueVoltage",
    maxId: "maxVoltage",
    maxValue: 500,
    unit: "V",
  },
  current: {
    fillId: "gaugeFillCurrent",
    valueId: "gaugeValueCurrent",
    maxId: "maxCurrent",
    maxValue: 20,
    unit: "A",
  },
  power: {
    fillId: "gaugeFillPower",
    valueId: "gaugeValuePower",
    maxId: "maxPower",
    maxValue: 2000,
    unit: "W",
  },
  energy: {
    fillId: "gaugeFillEnergy",
    valueId: "gaugeValueEnergy",
    maxId: "maxEnergy",
    maxValue: 100,
    unit: "kWh",
  },
  cost: {
    fillId: "gaugeFillCost",
    valueId: "gaugeValueCost",
    maxId: "maxCost",
    maxValue: 100,
    unit: "INR",
  },
};

/**
 * Update a specific gauge.
 * @param {string} paramKey - Key from gaugeConfig.
 * @param {number} newValue - New reading to display.
 */

function setGaugeValue(paramKey, newValue) {
  const { fillId, valueId, maxId, maxValue, unit } = gaugeConfig[paramKey];

  const gaugeFill = document.getElementById(fillId);
  const gaugeValue = document.getElementById(valueId);
  const gaugeMax = document.getElementById(maxId);

  gaugeMax.textContent = maxValue;

  let value = Math.max(0, Math.min(newValue, maxValue));

  const fraction = value / maxValue;
  const dashOffset = ARC_LENGTH - ARC_LENGTH * fraction;

  gaugeFill.style.strokeDashoffset = dashOffset;
  gaugeValue.textContent = `${value.toFixed(3)} ${unit}`;
}

/**
 * Fetch real-time data from the API and update all gauges.
 */
function fetchData() {
  fetch("http://domain.name/api/realtime")
    .then((response) => response.json())
    .then((data) => {
      setGaugeValue("voltage", data.voltage);
      setGaugeValue("current", data.current);
      setGaugeValue("power", data.power);
      setGaugeValue("energy", data.energy);
      setGaugeValue("cost", data.cost);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

fetchData();
setInterval(fetchData, 5000);
