const DecelUI = {
  init() {
    this.speedInput = document.getElementById("decel-v");
    this.timeInput = document.getElementById("decel-t");
    this.resultDecel = document.getElementById("res-a-time");
    this.resultGForce = document.getElementById("res-g-force");
    this.calcBox = document.getElementById("decel-calc");

    if (!this.speedInput || !this.timeInput) {
      return;
    }

    [this.speedInput, this.timeInput].forEach((element) => {
      element.addEventListener("input", () => this.calculate());
      element.addEventListener("change", () => this.calculate());
    });
  },

  calculate() {
    const speedKmh = this.parseDecimal(this.speedInput.value);
    const timeSeconds = this.parseDecimal(this.timeInput.value);

    if (!Number.isFinite(speedKmh) || !Number.isFinite(timeSeconds)) {
      this.clearResults();
      return;
    }

    const result = Physics.calculateDecel(speedKmh, timeSeconds);

    if (!result) {
      this.clearResults();
      return;
    }

    const speedMs = Physics.kmhToMs(speedKmh);
    this.resultDecel.textContent = result.deceleration.toFixed(2);
    this.resultGForce.textContent = `${result.gForce.toFixed(3)} G`;
    this.setResultColor(result.deceleration);
    this.updateCalculation(speedKmh, speedMs, timeSeconds, result.deceleration, result.gForce);
  },

  clearResults() {
    this.resultDecel.textContent = "0.00";
    this.resultGForce.textContent = "0.000 G";
    this.resultDecel.style.color = "var(--text-primary)";
    if (this.calcBox) {
      this.calcBox.innerHTML = "<div>Enter speed and time to show the working.</div>";
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

  updateCalculation(speedKmh, speedMs, timeSeconds, deceleration, gForce) {
    if (!this.calcBox) {
      return;
    }

    this.calcBox.innerHTML = `
      <div>Speed conversion: ${speedKmh.toFixed(2)} km/h ÷ 3.6 = ${speedMs.toFixed(2)} m/s</div>
      <div>Deceleration: a = u / t = ${speedMs.toFixed(2)} / ${timeSeconds.toFixed(2)} = ${deceleration.toFixed(2)} m/s²</div>
      <div>G-force: ${deceleration.toFixed(2)} ÷ 9.80665 = ${gForce.toFixed(3)} G</div>
    `;
  }
};
