const DecelUI = {
  init() {
    this.mode = "time";
    this.pendingFrame = 0;
    this.lastCalculationKey = "";
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

    const queueCalculation = () => this.scheduleCalculate();

    [this.speedInput, this.secondaryInput].forEach((element) => {
      element.addEventListener("input", queueCalculation);
      element.addEventListener("change", queueCalculation);
    });

    if (this.modeToggle) {
      this.modeToggle.addEventListener("click", () => this.toggleMode());
    }

    this.updateModeUI();
  },

  scheduleCalculate() {
    if (this.pendingFrame) {
      return;
    }

    this.pendingFrame = window.requestAnimationFrame(() => {
      this.pendingFrame = 0;
      this.calculate();
    });
  },

  calculate() {
    const calculationKey = `${this.mode}|${this.speedInput.value}|${this.secondaryInput.value}`;

    if (calculationKey === this.lastCalculationKey) {
      return;
    }

    this.lastCalculationKey = calculationKey;

    const speedKmh = Physics.parseDecimal(this.speedInput.value);
    const secondaryValue = Physics.parseDecimal(this.secondaryInput.value);

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
      this.setCalculationLines([
        this.mode === "time"
          ? "Enter speed and time to show the working."
          : "Enter speed and distance to show the working."
      ]);
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

  updateCalculation(speedKmh, speedMs, secondaryValue, deceleration, gForce) {
    if (!this.calcBox) {
      return;
    }

    if (this.mode === "time") {
      this.setCalculationLines([
        `Speed conversion: ${speedKmh.toFixed(2)} km/h \u00f7 3.6 = ${speedMs.toFixed(2)} m/s`,
        `Deceleration: a = u / t = ${speedMs.toFixed(2)} / ${secondaryValue.toFixed(2)} = ${deceleration.toFixed(2)} m/s\u00b2`,
        `G-force: ${deceleration.toFixed(2)} \u00f7 ${Physics.G_ACCELERATION} = ${gForce.toFixed(3)} G`
      ]);
      return;
    }

    this.setCalculationLines([
      `Speed conversion: ${speedKmh.toFixed(2)} km/h \u00f7 3.6 = ${speedMs.toFixed(2)} m/s`,
      `Deceleration: a = u\u00b2 / (2s) = (${speedMs.toFixed(2)}\u00b2) / (2 \u00d7 ${secondaryValue.toFixed(2)}) = ${deceleration.toFixed(2)} m/s\u00b2`,
      `G-force: ${deceleration.toFixed(2)} \u00f7 ${Physics.G_ACCELERATION} = ${gForce.toFixed(3)} G`
    ]);
  },

  setCalculationLines(lines) {
    this.calcBox.replaceChildren(
      ...lines.map((line) => {
        const element = document.createElement("div");
        element.textContent = line;
        return element;
      })
    );
  },

  toggleMode() {
    this.mode = this.mode === "time" ? "distance" : "time";

    if (this.secondaryInput) {
      this.secondaryInput.value = "";
    }

    this.lastCalculationKey = "";
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
        : "Formula: 0 = u\u00b2 + 2as, so deceleration magnitude = u\u00b2 / (2s).";
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
