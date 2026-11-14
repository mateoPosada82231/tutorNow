import { Suspense } from 'react';
import RequestDetailClient from './RequestDetailClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function TutoringRequestDetailPage() {
  return (
    <Suspense fallback={null}>
      <RequestDetailClient />
    </Suspense>
  );
}
