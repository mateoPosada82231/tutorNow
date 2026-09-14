import { ConfirmationStatus } from '@/features/auth/components/ConfirmationStatus';
import { confirmPasswordChange } from '@/features/auth/api/authApi';

interface ConfirmPasswordChangePageProps {
  searchParams: { token?: string };
}

export default function ConfirmPasswordChangePage({ searchParams }: ConfirmPasswordChangePageProps) {
  return (
    <ConfirmationStatus
      token={searchParams.token ?? null}
      action={confirmPasswordChange}
      title="Cambio de contrasena"
      successMessage="Tu contrasena fue actualizada correctamente."
    />
  );
}
