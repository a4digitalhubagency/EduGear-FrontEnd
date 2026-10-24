/**
 * The backend's NG_PHONE_REGEX (src/tenants/dto/school.dto.ts), so phone numbers are
 * checked the same way on both sides: 0803..., 234803... or +234803...
 */
export const NG_PHONE_REGEX = /^(\+?234|0)[789][01]\d{8}$/;
export const NG_PHONE_MESSAGE = "Enter a Nigerian phone number, e.g. 08031234567";

/** Settings prefixes: 1-10 letters, digits or hyphens, starting with a letter or digit. */
export const PREFIX_REGEX = /^[A-Z0-9][A-Z0-9-]{0,9}$/;
