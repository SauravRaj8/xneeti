
export function computeBackoffMs(attempts) {
    const base = 100 * Math.pow(2, Math.max(0, attempts));
    const jitter = Math.floor(Math.random() * 50);
    return base + jitter;
}