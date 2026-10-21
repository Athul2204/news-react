/* Validation rules for the auth / settings forms (add new ones here).
   Each rule gets (value, allValues, matchName) and returns an error message or ''. */
export const rules = {
  email(value) {
    const v = value.trim();
    if (!v) return 'Enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'That email looks incomplete. Use a format like name@example.com.';
    return '';
  },
  password(value) {
    if (!value) return 'Enter your password.';
    if (value.length < 8) return 'Passwords have at least 8 characters.';
    return '';
  },
  username(value) {
    const v = value.trim();
    if (!v) return 'Choose a username.';
    if (!/^[A-Za-z0-9_.]{3,20}$/.test(v)) return 'Use 3 to 20 letters, numbers, dots or underscores.';
    return '';
  },
  phone(value) {
    const v = value.trim();
    if (!v) return 'Enter your contact number.';
    const digits = v.replace(/\D/g, '').length;
    if (!/^\+?[0-9\s\-().]+$/.test(v) || digits < 7 || digits > 15) return 'Enter a valid phone number with 7 to 15 digits.';
    return '';
  },
  newPassword(value) {
    if (!value) return 'Create a password.';
    if (value.length < 8) return 'Use at least 8 characters.';
    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return 'Include at least one letter and one number.';
    return '';
  },
  /* `match` is the name of the field this one must equal */
  confirmPassword(value, values, match) {
    if (!value) return 'Re-enter your password.';
    if (match && value !== values[match]) return 'Passwords do not match.';
    return '';
  },
};
