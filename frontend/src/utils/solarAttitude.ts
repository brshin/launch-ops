export type SolarAttitude = {
  /** Radians, north of the equator. */
  declination: number;
  /** Radians, east of Greenwich. */
  subsolarLongitude: number;
};

const DAY_MS = 86_400_000;

/**
 * Where the sun is overhead.
 * Spencer's approximation: longitude from UTC, declination from the day of year.
 * Accurate to about a degree, which is enough for the terminator on this globe.
 */
export function solarAttitude(date: Date): SolarAttitude {
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear =
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - yearStart) /
    DAY_MS;
  const hour =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hour - 12) / 24);

  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const subsolarLongitude = -(((hour * 60 + equationOfTime) / 4 - 180) * Math.PI) / 180;

  return { declination, subsolarLongitude };
}

/** True when the sun is above the horizon, ignoring terrain. */
export function isDaylit(latitudeDeg: number, longitudeDeg: number, date: Date): boolean {
  const { declination, subsolarLongitude } = solarAttitude(date);
  const lat = (latitudeDeg * Math.PI) / 180;
  const lon = (longitudeDeg * Math.PI) / 180;
  const cosZenith =
    Math.sin(lat) * Math.sin(declination) +
    Math.cos(lat) * Math.cos(declination) * Math.cos(lon - subsolarLongitude);
  return cosZenith > 0;
}
