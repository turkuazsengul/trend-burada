/**
 * One-shot cleanup of the per-user `tb_addresses_*` keys that we used to write into
 * localStorage before the address feature moved to the backend.
 *
 * This runs at app boot. Idempotent — it just removes any keys that match the legacy
 * pattern and is a no-op if there are none. Safe to call repeatedly.
 *
 * Why we just drop the data instead of pushing it to the backend:
 *   - Pre-launch userbase only had test/demo data.
 *   - The legacy schema is missing required server fields (country) and contains a UI-only
 *     concept (type=home/work) that the server doesn't model. A migration would have to
 *     guess defaults and would still be lossy.
 *   - The user explicitly asked for the legacy entries to be deleted.
 */
const LEGACY_ADDRESS_KEY_PREFIX = "tb_addresses_";

const clearLegacyAddresses = () => {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
        return;
    }

    try {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith(LEGACY_ADDRESS_KEY_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch (e) {
        // Storage may be disabled (private browsing, quota errors). The cleanup is a
        // best-effort hygiene step, not a correctness requirement, so we swallow.
    }
};

export default clearLegacyAddresses;
