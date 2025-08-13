/**
 * Format seconds into "M:SS" or "H:MM:SS".
 *
 * @param {number} value - time value (seconds by default unless `inputIsMs` is true)
 * @param {object} [opts]
 * @param {boolean} [opts.inputIsMs=false] - if true, treat `value` as milliseconds
 * @param {boolean} [opts.verbose=false] - if true, return verbose "1h 2m 03s"
 * @returns {string} formatted time
 */
export default function formatTime(value, opts = {}) {
  const { inputIsMs = false, verbose = false } = opts;

  if (typeof value !== "number" || !isFinite(value)) return "0:00";

  // Normalize to whole seconds, non-negative
  const totalSeconds = Math.max(
    0,
    Math.floor(inputIsMs ? value / 1000 : value)
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad2 = (n) => String(n).padStart(2, "0");

  if (verbose) {
    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes || hours) parts.push(`${minutes}m`);
    parts.push(`${pad2(seconds)}s`);
    return parts.join(" ");
  }

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  } else {
    return `${minutes}:${pad2(seconds)}`;
  }
}
