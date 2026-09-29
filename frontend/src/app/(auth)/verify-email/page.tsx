'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmationStatus } from '@/features/auth/components/ConfirmationStatus';
import { verifyEmail } from '@/features/auth/api/authApi';
import { Spinner } from '@/components/ui/Spinner';

function VerifyEmailContent() {
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
