const app = {
  currentView: "home",

  init() {
    this.views = Array.from(document.querySelectorAll(".view"));
    this.navButtons = Array.from(document.querySelectorAll("[data-view-target]"));
    this.twistWs = document.getElementById("twist-ws");
    this.twistWl = document.getElementById("twist-wl");
    this.twistValue = document.getElementById("twist-val");
    this.twistCalc = document.getElementById("twist-calc");
    this.weatherStatus = document.getElementById("weather-status");
    this.weatherTemp = document.getElementById("weather-temp");
    this.weatherCondition = document.getElementById("weather-condition");
    this.weatherDetails = document.getElementById("weather-details");
    this.weatherUpdated = document.getElementById("weather-updated");

    this.attachNavigation();
    this.attachTwistInputs();
    this.loadWeather();

    if (typeof DecelUI !== "undefined") {
      DecelUI.init();
    }

    this.showView(this.currentView);
  },

  attachNavigation() {
    this.navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.viewTarget;
        if (target) {
          this.showView(target);
        }
      });
    });
  },

  showView(viewId) {
    this.views.forEach((view) => {
      view.classList.toggle("hidden", view.id !== viewId);
    });

    this.navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.viewTarget === viewId);
    });

    this.currentView = viewId;
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  attachTwistInputs() {
    if (!this.twistWs || !this.twistWl) {
      return;
    }

    [this.twistWs, this.twistWl].forEach((element) => {
      element.addEventListener("input", () => this.calculateTwist());
      element.addEventListener("change", () => this.calculateTwist());
    });
  },

  calculateTwist() {
    const ws = this.parseDecimal(this.twistWs.value);
    const wl = this.parseDecimal(this.twistWl.value);

    if (!Number.isFinite(ws) || !Number.isFinite(wl) || ws <= 0 || wl <= 0) {
      this.setTwistState(0, "var(--accent-success)");
      this.resetTwistCalculation();
      return;
    }

    const deviation = Math.abs(((ws - wl) / ws) * 100);
    this.updateTwistCalculation(ws, wl, deviation);

    if (deviation > 60) {
      this.setTwistState(deviation, "var(--accent-error)");
      return;
    }

    if (deviation > 50) {
      this.setTwistState(deviation, "var(--accent-warn)");
      return;
    }

    this.setTwistState(deviation, "var(--accent-success)");
  },

  setTwistState(value, resultColor) {
    this.twistValue.textContent = value.toFixed(2);
    this.twistValue.style.color = resultColor;
  },

  resetTwistCalculation() {
    if (!this.twistCalc) {
      return;
    }

    this.twistCalc.innerHTML = "<div>Enter WS and WL to show the working.</div>";
  },

  updateTwistCalculation(ws, wl, deviation) {
    if (!this.twistCalc) {
      return;
    }

    this.twistCalc.innerHTML = `
      <div>Difference: WS - WL = ${ws.toFixed(2)} - ${wl.toFixed(2)} = ${(ws - wl).toFixed(2)}</div>
      <div>Deviation: ((WS - WL) / WS) × 100 = ((${ws.toFixed(2)} - ${wl.toFixed(2)}) / ${ws.toFixed(2)}) × 100</div>
      <div>Result: ${deviation.toFixed(2)}%</div>
    `;
  },

  async loadWeather() {
    if (!this.weatherStatus || !this.weatherTemp || !this.weatherCondition || !this.weatherDetails || !this.weatherUpdated) {
      return;
    }

    const latitude = -34.8333;
    const longitude = 138.5833;
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Australia%2FAdelaide`;

    this.setWeatherState({
      status: "Loading",
      temp: "--°C",
      condition: "Loading current conditions...",
      details: "Wind -- km/h",
      updated: "Updating weather..."
    });

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Weather request failed with status ${response.status}`);
      }

      const data = await response.json();
      const current = data.current;

      if (!current) {
        throw new Error("Weather response was missing current conditions");
      }

      const temperature = Math.round(current.temperature_2m);
      const windSpeed = Math.round(current.wind_speed_10m);
      const condition = this.getWeatherDescription(current.weather_code);
      const updated = this.formatWeatherTime(current.time);

      this.setWeatherState({
        status: condition,
        temp: `${temperature}°C`,
        condition,
        details: `Wind ${windSpeed} km/h`,
        updated: `Updated ${updated}`
      });
    } catch (error) {
      this.setWeatherState({
        status: "Offline",
        temp: "--°C",
        condition: "Current weather unavailable",
        details: "Check connection to refresh weather",
        updated: "Unable to load Dry Creek weather"
      });
    }
  },

  setWeatherState({ status, temp, condition, details, updated }) {
    this.weatherStatus.textContent = status;
    this.weatherTemp.textContent = temp;
    this.weatherCondition.textContent = condition;
    this.weatherDetails.textContent = details;
    this.weatherUpdated.textContent = updated;
  },

  getWeatherDescription(weatherCode) {
    const weatherMap = {
      0: "Clear",
      1: "Mostly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Rime fog",
      51: "Light drizzle",
      53: "Drizzle",
      55: "Dense drizzle",
      56: "Freezing drizzle",
      57: "Heavy freezing drizzle",
      61: "Light rain",
      63: "Rain",
      65: "Heavy rain",
      66: "Freezing rain",
      67: "Heavy freezing rain",
      71: "Light snow",
      73: "Snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Rain showers",
      81: "Heavy showers",
      82: "Violent showers",
      85: "Snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm hail",
      99: "Severe hail"
    };

    return weatherMap[weatherCode] || "Current conditions";
  },

  formatWeatherTime(isoTime) {
    if (!isoTime) {
      return "just now";
    }

    const date = new Date(isoTime);

    if (Number.isNaN(date.getTime())) {
      return "recently";
    }

    return new Intl.DateTimeFormat("en-AU", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  },

  parseDecimal(value) {
    if (typeof value !== "string") {
      return Number.NaN;
    }

    const normalized = value.trim().replace(",", ".");
    return Number.parseFloat(normalized);
  }
};

document.addEventListener("DOMContentLoaded", () => app.init());
