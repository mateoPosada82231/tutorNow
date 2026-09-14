'use client';

import { useSearchParams } from 'next/navigation';
import { ConfirmationStatus } from '@/features/auth/components/ConfirmationStatus';
import { verifyEmail } from '@/features/auth/api/authApi';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();

  return (
    <ConfirmationStatus
      token={searchParams.get('token')}
      action={verifyEmail}
      title="Verificacion de correo"
      successMessage="Correo verificado correctamente. Ya puedes iniciar sesion."
    />
  );
}
