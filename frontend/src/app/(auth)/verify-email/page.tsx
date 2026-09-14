import { ConfirmationStatus } from '@/features/auth/components/ConfirmationStatus';
import { verifyEmail } from '@/features/auth/api/authApi';

interface VerifyEmailPageProps {
  searchParams: { token?: string };
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  return (
    <ConfirmationStatus
      token={searchParams.token ?? null}
      action={verifyEmail}
      title="Verificacion de correo"
      successMessage="Correo verificado correctamente. Ya puedes iniciar sesion."
    />
  );
}
