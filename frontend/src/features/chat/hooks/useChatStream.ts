'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Mensaje } from '../types';

type OnMessageCallback = (mensaje: Mensaje) => void;

export function useChatStream(asesoriaId: number | null, onMessage: OnMessageCallback): () => void {
  const token = useAuthStore((state) => state.token);
  const emitterRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const disconnect = useCallback(() => {
    if (emitterRef.current) {
      emitterRef.current.close();
      emitterRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!asesoriaId || !token) return;

    const connect = async () => {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        });

        if (!response.ok || !response.body) {
          console.warn('[SSE] Failed to connect:', response.status);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const mensaje: Mensaje = JSON.parse(line.slice(6));
                if (mensaje.asesoriaId === asesoriaId) {
                  onMessage(mensaje);
                }
              } catch {
                // Ignore parse errors (comments, etc.)
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.error('[SSE] Error:', err);
      }
    };

    connect();

    return () => {
      disconnect();
    };
  }, [asesoriaId, token, onMessage, disconnect]);

  return disconnect;
}