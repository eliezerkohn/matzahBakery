export const toPositiveInt = (value) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const normalizePhoneDigits = (value, maxLength = 15) =>
    String(value ?? '').replace(/\D/g, '').slice(0, maxLength);

export const isValidPhoneDigits = (value, minLength = 10, maxLength = 15) => {
    const normalized = normalizePhoneDigits(value, maxLength);
    return normalized.length >= minLength && normalized.length <= maxLength;
};

export const safeTrim = (value, maxLength = 120) =>
    String(value ?? '').trim().slice(0, maxLength);
