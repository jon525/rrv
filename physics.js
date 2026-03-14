const Physics = {
  kmhToMs(kmh) {
    return kmh / 3.6;
  },

  calculateDecel(speedKmh, distanceMeters) {
    if (speedKmh <= 0 || distanceMeters <= 0) {
      return null;
    }

    const speedMs = this.kmhToMs(speedKmh);
    const deceleration = (speedMs * speedMs) / (2 * distanceMeters);
    const gForce = deceleration / 9.80665;

    return {
      deceleration,
      gForce
    };
  }
};
