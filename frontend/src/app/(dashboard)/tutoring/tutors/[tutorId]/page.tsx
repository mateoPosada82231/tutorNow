import { Suspense } from 'react';
import TutorProfileClient from './TutorProfileClient';

export function generateStaticParams() {
  return [{ tutorId: '_' }];
}

export default function TutorProfilePage() {
  return (
    <Suspense fallback={null}>
      <TutorProfileClient />
    </Suspense>
  );
}
