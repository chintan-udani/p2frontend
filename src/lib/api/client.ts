"use client";

import { useQuery, useMutation, QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// Base URL for backend API. Configure via NEXT_PUBLIC_API_BASE_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
console.log('API_BASE_URL', API_BASE_URL);
function buildUrl(path: string): string {
  if (!path) throw new Error('Path is required');
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function apiRequest<T>(method: HttpMethod, path: string, body?: any, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  let payload: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    credentials: 'include', // send cookies for withCredentials flows
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
    body: payload,
    ...init,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : (await res.text() as any);

  if (!res.ok) {
    const message = isJson && data?.error ? data.error : res.statusText;
    const error = new Error(message || 'Request failed');
    (error as any).status = res.status;
    (error as any).data = data;
    throw error;
  }
  return data as T;
}

export function apiGet<T>(path: string, init?: RequestInit) {
  return apiRequest<T>('GET', path, undefined, init);
}

export function apiPost<T>(path: string, body?: any, init?: RequestInit) {
  return apiRequest<T>('POST', path, body, init);
}

export function apiPut<T>(path: string, body?: any, init?: RequestInit) {
  return apiRequest<T>('PUT', path, body, init);
}

export function apiDelete<T>(path: string, body?: any, init?: RequestInit) {
  // Some backends accept JSON body in DELETE; pass if provided
  return apiRequest<T>('DELETE', path, body, init);
}

// TanStack Query wrappers
export function useApiGet<T>(queryKey: QueryKey, path: string, options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>) {
  return useQuery<T>({
    queryKey,
    queryFn: () => apiGet<T>(path),
    ...(options || {}),
  });
}

export function useApiPost<TOut, TVar = any>(path: string, options?: UseMutationOptions<TOut, unknown, TVar>) {
  return useMutation<TOut, unknown, TVar>({
    mutationFn: (variables: TVar) => apiPost<TOut>(path, variables),
    ...(options || {}),
  });
}

export function useApiPut<TOut, TVar = any>(path: string, options?: UseMutationOptions<TOut, unknown, TVar>) {
  return useMutation<TOut, unknown, TVar>({
    mutationFn: (variables: TVar) => apiPut<TOut>(path, variables),
    ...(options || {}),
  });
}

export function useApiDelete<TOut, TVar = any>(path: string, options?: UseMutationOptions<TOut, unknown, TVar>) {
  return useMutation<TOut, unknown, TVar>({
    mutationFn: (variables: TVar) => apiDelete<TOut>(path, variables),
    ...(options || {}),
  });
}

// Optional convenience for imperative calls with a configured base
export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};

