export const API_URL = import.meta.env.VITE_API_URL as string;

export interface ApiFieldIssue {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly issues: ApiFieldIssue[];

  constructor(status: number, message: string, issues: ApiFieldIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
}

interface ErrorBody {
  message?: string;
  errors?: ApiFieldIssue[];
}

async function readErrorBody(response: Response): Promise<ErrorBody> {
  try {
    return (await response.json()) as ErrorBody;
  } catch {
    return {};
  }
}

export async function request<T>(
  path: string,
  { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
  const hasBody = body !== undefined;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'Não foi possível conectar à API. Verifique a conexão e tente de novo.',
    );
  }

  if (!response.ok) {
    const error = await readErrorBody(response);
    throw new ApiError(
      response.status,
      error.message ?? 'Erro ao processar a requisição',
      error.errors ?? [],
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
