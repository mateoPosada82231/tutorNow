export const INSTITUTIONAL_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@elpoli\.edu\.co$/;

export const PASSWORD_RULES_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'La contrasena debe tener al menos 8 caracteres';
  if (!PASSWORD_RULES_REGEX.test(password)) {
    return 'La contrasena debe tener mayuscula, minuscula y numero';
  }
  return null;
}

export function validateInstitutionalEmail(email: string): string | null {
  if (!INSTITUTIONAL_EMAIL_REGEX.test(email)) {
    return 'Usa tu correo institucional @elpoli.edu.co';
  }
  return null;
}
