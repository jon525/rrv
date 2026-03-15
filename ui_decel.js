const DecelUI = {
  init() {
    this.mode = "time";
    this.speedInput = document.getElementById("decel-v");
    this.secondaryInput = document.getElementById("decel-secondary");
    this.secondaryLabel = document.getElementById("decel-secondary-label");
    this.modeToggle = document.getElementById("decel-mode-toggle");
    this.description = document.getElementById("decel-description");
    this.formulaInfo = document.getElementById("decel-formula");
    this.resultDecel = document.getElementById("res-a-time");
    this.resultGForce = document.getElementById("res-g-force");
    this.calcBox = document.getElementById("decel-calc");

    if (!this.speedInput || !this.secondaryInput) {
      return;
    }

    [this.speedInput, this.secondaryInput].forEach((element) => {
      element.addEventListener("input", () => this.calculate());
      element.addEventListener("change", () => this.calculate());
    });

    if (this.modeToggle) {
      this.modeToggle.addEventListener("click", () => this.toggleMode());
    }

    this.updateModeUI();
  },

  calculate() {
    const speedKmh = this.parseDecimal(this.speedInput.value);
    const secondaryValue = this.parseDecimal(this.secondaryInput.value);

    if (!Number.isFinite(speedKmh) || !Number.isFinite(secondaryValue)) {
      this.clearResults();
      return;
    }

    const result = this.mode === "time"
      ? Physics.calculateDecelFromTime(speedKmh, secondaryValue)
      : Physics.calculateDecelFromDistance(speedKmh, secondaryValue);

    if (!result) {
      this.clearResults();
      return;
    }

    const speedMs = Physics.kmhToMs(speedKmh);
    this.resultDecel.textContent = result.deceleration.toFixed(2);
    this.resultGForce.textContent = `${result.gForce.toFixed(3)} G`;
    this.setResultColor(result.deceleration);
    this.updateCalculation(speedKmh, speedMs, secondaryValue, result.deceleration, result.gForce);
  },

  clearResults() {
    this.resultDecel.textContent = "0.00";
    this.resultGForce.textContent = "0.000 G";
    this.resultDecel.style.color = "var(--text-primary)";
    if (this.calcBox) {
      this.calcBox.innerHTML = this.mode === "time"
        ? "<div>Enter speed and time to show the working.</div>"
        : "<div>Enter speed and distance to show the working.</div>";
    }
  },

  setResultColor(deceleration) {
    if (deceleration <= 0.9) {
      this.resultDecel.style.color = "var(--accent-error)";
      return;
    }

    if (deceleration <= 1.1) {
      this.resultDecel.style.color = "var(--accent-warn)";
      return;
    }

    this.resultDecel.style.color = "var(--accent-success)";
  },

  parseDecimal(value) {
    if (typeof value !== "string") {
      return Number.NaN;
    }

    const normalized = value.trim().replace(",", ".");
    return Number.parseFloat(normalized);
  },

  updateCalculation(speedKmh, speedMs, secondaryValue, deceleration, gForce) {
    if (!this.calcBox) {
      return;
    }

    if (this.mode === "time") {
      this.calcBox.innerHTML = `
        <div>Speed conversion: ${speedKmh.toFixed(2)} km/h ÷ 3.6 = ${speedMs.toFixed(2)} m/s</div>
        <div>Deceleration: a = u / t = ${speedMs.toFixed(2)} / ${secondaryValue.toFixed(2)} = ${deceleration.toFixed(2)} m/s²</div>
        <div>G-force: ${deceleration.toFixed(2)} ÷ 9.80665 = ${gForce.toFixed(3)} G</div>
      `;
      return;
    }

    this.calcBox.innerHTML = `
      <div>Speed conversion: ${speedKmh.toFixed(2)} km/h ÷ 3.6 = ${speedMs.toFixed(2)} m/s</div>
      <div>Deceleration: a = u² / (2s) = (${speedMs.toFixed(2)}²) / (2 × ${secondaryValue.toFixed(2)}) = ${deceleration.toFixed(2)} m/s²</div>
      <div>G-force: ${deceleration.toFixed(2)} ÷ 9.80665 = ${gForce.toFixed(3)} G</div>
    `;
  },

  toggleMode() {
    this.mode = this.mode === "time" ? "distance" : "time";
    this.updateModeUI();
    this.clearResults();
  },

  updateModeUI() {
    if (this.secondaryLabel) {
      this.secondaryLabel.textContent = this.mode === "time"
        ? "Stopping Time (s)"
        : "Stopping Distance (m)";
    }

    if (this.formulaInfo) {
      this.formulaInfo.textContent = this.mode === "time"
        ? "Formula: 0 = u + at, so deceleration magnitude = u / t."
        : "Formula: 0 = u² + 2as, so deceleration magnitude = u² / (2s).";
    }

    if (this.description) {
      this.description.textContent = this.mode === "time"
        ? "Enter the starting speed and stopping time to estimate deceleration and g-force."
        : "Enter the starting speed and stopping distance to estimate deceleration and g-force.";
    }

    if (this.modeToggle) {
      this.modeToggle.textContent = this.mode === "time" ? "Mode: Time" : "Mode: Distance";
    }
  }
};
