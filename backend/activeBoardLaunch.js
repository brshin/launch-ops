/**
 * Near-term console board — drop LL2 year/quarter catalog stubs and
 * month-bucket rows that aren't in the current calendar month (UTC).
 *
 * Keeps MIN/HR/DAY (and unknown precision) even when status is TBD/TBC.
 */

function precisionTokens(netPrecision) {
  if (!netPrecision || typeof netPrecision !== "object") return [];
  return [netPrecision.abbrev, netPrecision.name]
    .map((value) => (value || "").trim().toUpperCase())
    .filter(Boolean);
}

function isYearPrecision(token) {
  return token === "Y" || token === "YR" || token === "YEAR";
}

function isQuarterPrecision(token) {
  return (
    token === "Q" ||
    token === "QTR" ||
    token === "QUARTER" ||
    /^Q[1-4]$/.test(token)
  );
}

function isMonthPrecision(token) {
  return token === "M" || token === "MON" || token === "MONTH";
}

/**
 * @param {{ net?: string | null, net_precision?: { abbrev?: string | null, name?: string | null } | null }} launch
 * @param {Date | number} [now]
 */
function isActiveBoardLaunch(launch, now = Date.now()) {
  const tokens = precisionTokens(launch?.net_precision);
  if (tokens.length === 0) return true;

  if (tokens.some(isYearPrecision) || tokens.some(isQuarterPrecision)) {
    return false;
  }

  if (!tokens.some(isMonthPrecision)) return true;

  if (launch?.net == null || launch.net === "") return false;
  const netMs = new Date(launch.net).getTime();
  if (Number.isNaN(netMs)) return false;

  const net = new Date(netMs);
  const current = new Date(now);
  return (
    net.getUTCFullYear() === current.getUTCFullYear() &&
    net.getUTCMonth() === current.getUTCMonth()
  );
}

module.exports = { isActiveBoardLaunch };
