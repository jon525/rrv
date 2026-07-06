const Physics = {
  G_ACCELERATION: 9.80665,
  KMH_TO_MS: 3.6,

  parseDecimal(value) {
    if (typeof value !== "string") {
      return Number.NaN;
    }

    const normalized = value.trim().replace(",", ".");

    if (normalized === "") {
      return Number.NaN;
    }

    return Number(normalized);
  },

  kmhToMs(kmh) {
    return kmh / this.KMH_TO_MS;
  },

  calculateDecelFromTime(speedKmh, timeSeconds) {
    if (speedKmh <= 0 || timeSeconds <= 0) {
      return null;
    }

    const speedMs = this.kmhToMs(speedKmh);
    const deceleration = speedMs / timeSeconds;
    const gForce = deceleration / this.G_ACCELERATION;

    return {
      deceleration,
      gForce
    };
  },

  calculateDecelFromDistance(speedKmh, distanceMeters) {
    if (speedKmh <= 0 || distanceMeters <= 0) {
      return null;
    }

    const speedMs = this.kmhToMs(speedKmh);
    const deceleration = (speedMs * speedMs) / (2 * distanceMeters);
    const gForce = deceleration / this.G_ACCELERATION;

    return {
      deceleration,
      gForce
    };
  },

  calculateTwist(shortestWheelbase, longestWheelbase) {
    if (shortestWheelbase <= 0 || longestWheelbase <= 0) {
      return null;
    }

    return Math.abs(((shortestWheelbase - longestWheelbase) / shortestWheelbase) * 100);
  }
};
