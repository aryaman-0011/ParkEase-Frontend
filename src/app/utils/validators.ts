/**
 * ParkEase — Centralized regex validation patterns and helper functions.
 * Used across all forms (signup, settings, vehicles, manager lots/spots).
 */
export class Validators {

  // ── Regex Patterns ──

  /** Full name: 2-50 chars, letters + spaces only, no leading/trailing spaces */
  static readonly NAME_REGEX = /^[A-Za-z][A-Za-z\s]{0,48}[A-Za-z]$/;

  /** Email: standard email format */
  static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /** Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char */
  static readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

  /** Phone: Indian 10-digit mobile (optional +91 prefix) */
  static readonly PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;

  /** Vehicle plate: Indian format e.g. MH01AB1234 or MH 01 AB 1234 */
  static readonly VEHICLE_PLATE_REGEX = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{1,4}$/i;

  /** Business name: 2-100 chars, alphanumeric + spaces + common punctuation */
  static readonly BUSINESS_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s.,&\-'()]{0,98}[A-Za-z0-9.]$/;

  /** GST number: 15-character Indian GST format */
  static readonly GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/i;

  /** Lot/Spot name: 2-100 chars, alphanumeric + spaces + hyphens */
  static readonly LOT_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s\-.,()]{0,98}$/;

  /** City: 2-50 chars, letters + spaces */
  static readonly CITY_REGEX = /^[A-Za-z][A-Za-z\s\-]{0,48}[A-Za-z]$/;

  /** Address: 5-200 chars, common address characters */
  static readonly ADDRESS_REGEX = /^[A-Za-z0-9#][A-Za-z0-9\s,.\-/#()]{3,198}$/;

  /** Price: positive number, up to 2 decimal places */
  static readonly PRICE_REGEX = /^\d+(\.\d{1,2})?$/;

  /** Color: 2-30 chars, letters only */
  static readonly COLOR_REGEX = /^[A-Za-z][A-Za-z\s\-]{0,28}[A-Za-z]$/;

  /** Make/Model: 1-50 chars, alphanumeric + spaces + hyphens */
  static readonly MAKE_MODEL_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s\-]{0,48}$/;

  // ── Validation Helpers ──

  static validateName(value: string): string | null {
    if (!value.trim()) return 'Name is required';
    if (!this.NAME_REGEX.test(value.trim())) return 'Name must be 2-50 characters, letters and spaces only';
    return null;
  }

  static validateEmail(value: string): string | null {
    if (!value.trim()) return 'Email is required';
    if (!this.EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
    return null;
  }

  static validatePassword(value: string): string | null {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!this.PASSWORD_REGEX.test(value))
      return 'Password must include uppercase, lowercase, number, and special character';
    return null;
  }

  static validatePhone(value: string): string | null {
    if (!value.trim()) return null; // optional unless required
    if (!this.PHONE_REGEX.test(value.trim())) return 'Enter a valid 10-digit Indian phone number';
    return null;
  }

  static validatePhoneRequired(value: string): string | null {
    if (!value.trim()) return 'Phone number is required';
    if (!this.PHONE_REGEX.test(value.trim())) return 'Enter a valid 10-digit Indian phone number';
    return null;
  }

  static validateVehiclePlate(value: string): string | null {
    if (!value.trim()) return 'License plate is required';
    if (!this.VEHICLE_PLATE_REGEX.test(value.trim())) return 'Enter a valid Indian plate (e.g. MH01AB1234)';
    return null;
  }

  static validateBusinessName(value: string): string | null {
    if (!value.trim()) return 'Business name is required';
    if (!this.BUSINESS_NAME_REGEX.test(value.trim())) return 'Enter a valid business name (2-100 characters)';
    return null;
  }

  static validateGST(value: string): string | null {
    if (!value.trim()) return 'GST / Registration number is required';
    if (!this.GST_REGEX.test(value.trim())) return 'Enter a valid 15-digit GST number';
    return null;
  }

  static validateColor(value: string): string | null {
    if (!value.trim()) return null; // optional
    if (!this.COLOR_REGEX.test(value.trim())) return 'Enter a valid color (letters only)';
    return null;
  }

  static validateMakeModel(value: string, field: string): string | null {
    if (!value.trim()) return `${field} is required`;
    if (!this.MAKE_MODEL_REGEX.test(value.trim())) return `Enter a valid ${field.toLowerCase()} (letters, numbers, spaces)`;
    return null;
  }
}
