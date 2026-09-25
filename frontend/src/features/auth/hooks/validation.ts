export const INSTITUTIONAL_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@elpoli\.edu\.co$/;

export const PASSWORD_RULES_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const FULL_NAME_REGEX = /^[A-Za-záéíóúñÁÉÍÓÚÑüÜ\s]+$/;

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

export function validateFullName(name: string): string | null {
  if (!name.trim()) return 'El nombre completo es obligatorio';
  if (!FULL_NAME_REGEX.test(name.trim())) return 'El nombre solo debe contener letras';
  return null;
}
