'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { Alert } from '@/components/ui/Alert';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Alert type="error">
        El enlace no es valido o esta incompleto. Solicita uno nuevo desde la opcion de recuperar
        contrasena.
      </Alert>
    );
  }

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
