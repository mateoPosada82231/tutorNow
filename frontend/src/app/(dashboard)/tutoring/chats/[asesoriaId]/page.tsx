'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function ChatRedirectPage({ params }: { params: { asesoriaId: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('chat', params.asesoriaId);
    router.replace(`${pathname.replace(`/tutoring/chats/${params.asesoriaId}`, '/tutoring/chats')}?${newParams.toString()}`);
  }, [params.asesoriaId, router, pathname, searchParams]);

  return null;
}