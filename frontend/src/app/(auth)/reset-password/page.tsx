import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { Alert } from '@/components/ui/Alert';

interface ResetPasswordPageProps {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  if (!searchParams.token) {
    return (
      <Alert type="error">
        El enlace no es valido o esta incompleto. Solicita uno nuevo desde la opcion de recuperar
        contrasena.
      </Alert>
    );
  }

  return <ResetPasswordForm token={searchParams.token} />;
}
