const app = {
  currentView: "home",
  weatherCacheKey: "rrv-weather-v1",
  weatherCacheTtlMs: 10 * 60 * 1000,
  weatherFetchTimeoutMs: 6000,

  init() {
    this.appShell = document.querySelector(".app-shell");
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
    this.serviceDate = document.getElementById("service-date");
    this.serviceNote = document.getElementById("service-note");
    this.pendingTwistFrame = 0;
    this.lastTwistKey = "";

    this.attachNavigation();
    this.attachTwistInputs();
    this.loadWeather();
    this.loadNextService();

    if (typeof DecelUI !== "undefined") {
      DecelUI.init();
    }

    this.showView(this.currentView);
  },

  attachNavigation() {
    if (!this.appShell) {
      return;
    }

    this.appShell.addEventListener("click", (event) => {
      const button = event.target.closest("[data-view-target]");

      if (!button || !this.appShell.contains(button)) {
        return;
      }

      this.showView(button.dataset.viewTarget);
    });
  },

  showView(viewId) {
    if (!viewId || viewId === this.currentView) {
      return;
    }

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

    const queueTwistCalculation = () => this.scheduleTwistCalculation();

    [this.twistWs, this.twistWl].forEach((element) => {
      element.addEventListener("input", queueTwistCalculation);
      element.addEventListener("change", queueTwistCalculation);
    });
  },

  scheduleTwistCalculation() {
    if (this.pendingTwistFrame) {
      return;
    }

    this.pendingTwistFrame = window.requestAnimationFrame(() => {
      this.pendingTwistFrame = 0;
      this.calculateTwist();
    });
  },

  calculateTwist() {
    const twistKey = `${this.twistWs.value}|${this.twistWl.value}`;

    if (twistKey === this.lastTwistKey) {
      return;
    }

    this.lastTwistKey = twistKey;

    const ws = Physics.parseDecimal(this.twistWs.value);
    const wl = Physics.parseDecimal(this.twistWl.value);
    const deviation = Physics.calculateTwist(ws, wl);

    if (!Number.isFinite(deviation)) {
      this.setTwistState(0, "var(--accent-success)");
      this.resetTwistCalculation();
      return;
    }

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

    this.setTwistCalculationLines(["Enter WS and WL to show the working."]);
  },

  updateTwistCalculation(ws, wl, deviation) {
    if (!this.twistCalc) {
      return;
    }

    this.setTwistCalculationLines([
      `Difference: WS - WL = ${ws.toFixed(2)} - ${wl.toFixed(2)} = ${(ws - wl).toFixed(2)}`,
      `Deviation: ((WS - WL) / WS) \u00d7 100 = ((${ws.toFixed(2)} - ${wl.toFixed(2)}) / ${ws.toFixed(2)}) \u00d7 100`,
      `Result: ${deviation.toFixed(2)}%`
    ]);
  },

  setTwistCalculationLines(lines) {
    this.twistCalc.replaceChildren(
      ...lines.map((line) => {
        const element = document.createElement("div");
        element.textContent = line;
        return element;
      })
    );
  },

  async loadWeather() {
    if (!this.weatherStatus || !this.weatherTemp || !this.weatherCondition || !this.weatherDetails || !this.weatherUpdated) {
      return;
    }

    const cachedWeather = this.readWeatherCache();

    if (cachedWeather) {
      this.setWeatherState(cachedWeather);
      return;
    }

    const latitude = -34.8333;
    const longitude = 138.5833;
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Australia%2FAdelaide`;

    this.setWeatherState({
      status: "Loading",
      temp: "--\u00b0C",
      condition: "Loading current conditions...",
      details: "Wind -- km/h",
      updated: "Updating weather..."
    });

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.weatherFetchTimeoutMs);

    try {
      const response = await fetch(endpoint, { signal: controller.signal });

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
      const weatherState = {
        status: condition,
        temp: `${temperature}\u00b0C`,
        condition,
        details: `Wind ${windSpeed} km/h`,
        updated: `Updated ${updated}`
      };

      this.setWeatherState(weatherState);
      this.writeWeatherCache(weatherState);
    } catch (error) {
      this.setWeatherState({
        status: "Offline",
        temp: "--\u00b0C",
        condition: "Current weather unavailable",
        details: "Check connection to refresh weather",
        updated: "Unable to load Dry Creek weather"
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  },

  readWeatherCache() {
    try {
      const rawCache = window.localStorage.getItem(this.weatherCacheKey);

      if (!rawCache) {
        return null;
      }

      const cache = JSON.parse(rawCache);

      if (!cache.savedAt || !cache.state || Date.now() - cache.savedAt > this.weatherCacheTtlMs) {
        return null;
      }

      return cache.state;
    } catch (error) {
      return null;
    }
  },

  writeWeatherCache(state) {
    try {
      window.localStorage.setItem(this.weatherCacheKey, JSON.stringify({
        savedAt: Date.now(),
        state
      }));
    } catch (error) {
      // Weather still renders normally when storage is unavailable.
    }
  },

  setWeatherState({ status, temp, condition, details, updated }) {
    this.weatherStatus.textContent = status;
    this.weatherTemp.textContent = temp;
    this.weatherCondition.textContent = condition;
    this.weatherDetails.textContent = details;
    this.weatherUpdated.textContent = updated;
  },

  loadNextService() {
    if (!this.serviceDate || !this.serviceNote) {
      return;
    }

    try {
      const today = new Date();
      const nextServiceDate = new Date(today);
      nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);
      nextServiceDate.setDate(nextServiceDate.getDate() - 14);

      this.serviceDate.textContent = this.formatServiceDate(nextServiceDate);
      this.serviceNote.textContent = "Calculated as today + 3 months - 2 weeks";
    } catch (error) {
      this.serviceDate.textContent = this.formatServiceDateFallback(new Date());
      this.serviceNote.textContent = "Unable to calculate automatically on this browser";
    }
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

  formatServiceDate(date) {
    try {
      return new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date);
    } catch (error) {
      return this.formatServiceDateFallback(date);
    }
  },

  formatServiceDateFallback(date) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }
};

document.addEventListener("DOMContentLoaded", () => app.init());
