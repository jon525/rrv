const DecelUI = {
  init() {
    this.speedInput = document.getElementById("decel-v");
    this.distanceInput = document.getElementById("decel-s");
    this.resultDecel = document.getElementById("res-a-time");
    this.resultGForce = document.getElementById("res-g-force");

    if (!this.speedInput || !this.distanceInput) {
      return;
    }

    [this.speedInput, this.distanceInput].forEach((element) => {
      element.addEventListener("input", () => this.calculate());
    });
  },

  calculate() {
    const speedKmh = Number.parseFloat(this.speedInput.value);
    const distanceMeters = Number.parseFloat(this.distanceInput.value);

    if (!Number.isFinite(speedKmh) || !Number.isFinite(distanceMeters)) {
      this.clearResults();
      return;
    }

    const result = Physics.calculateDecel(speedKmh, distanceMeters);

    if (!result) {
      this.clearResults();
      return;
    }

    this.resultDecel.textContent = result.deceleration.toFixed(2);
    this.resultGForce.textContent = `${result.gForce.toFixed(3)} G`;
    this.setResultColor(result.deceleration);
  },

  clearResults() {
    this.resultDecel.textContent = "0.00";
    this.resultGForce.textContent = "0.000 G";
    this.resultDecel.style.color = "var(--text-primary)";
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
  }
};
