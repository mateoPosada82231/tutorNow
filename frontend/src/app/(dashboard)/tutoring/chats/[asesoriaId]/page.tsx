import { Suspense } from 'react';
import ChatRedirectClient from './ChatRedirectClient';

export function generateStaticParams() {
  return [{ asesoriaId: '_' }];
}

export default function ChatRedirectPage({ params }: { params: { asesoriaId: string } }) {
  return (
    <Suspense fallback={null}>
      <ChatRedirectClient params={params} />
    </Suspense>
  );
}
