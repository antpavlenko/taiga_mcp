import { translate } from './errorTranslator';
import { NormalizedError } from '../models/types';

// Minimal fetch/response typing so we do not rely on DOM lib in tsconfig
export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  headers: { forEach(cb: (value: string, key: string) => void): void };
  text(): Promise<string>;
}
export type FetchLike = (url: string, init: { method: string; headers: Record<string,string> }) => Promise<FetchLikeResponse>;

export interface GetOptions { query?: Record<string, unknown>; headers?: Record<string, string>; }

export class TaigaApiClient {
  private fetchFn: FetchLike;
  constructor(private baseUrl: string, private tokenProvider: () => Promise<string | undefined>, fetchImpl?: FetchLike, private log?: (msg: string) => void) {
    this.fetchFn = fetchImpl || (globalThis as any).fetch;
  }

  async get<T>(path: string, opts: GetOptions = {}): Promise<{ data?: T; error?: NormalizedError; status: number; headers: Record<string,string> }> {
    if (!this.baseUrl) {
      this.log?.(`[TaigaApi] No baseUrl configured; skipping GET ${path}`);
      return { status: 0, headers: {}, error: translate(0, null, new Error('No Taiga baseUrl configured')) };
    }
    const token = await this.tokenProvider();
    const url = this.buildUrl(path, opts.query);
    this.log?.(`[TaigaApi] GET ${url} (token=${token ? 'present' : 'missing'})`);
    const headers: Record<string,string> = { Accept: 'application/json', ...(opts.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    let resp: FetchLikeResponse;
    try {
      resp = await this.fetchFn(url, { method: 'GET', headers });
    } catch (e) {
      this.log?.(`[TaigaApi] GET ${url} network error: ${(e as Error).message}`);
      return { status: 0, headers: {}, error: translate(0, null, e as Error) };
    }
    let data: unknown = undefined;
    const text = await resp.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!resp.ok) {
      this.log?.(`[TaigaApi] GET ${url} -> ${resp.status}`);
      return { status: resp.status, headers: this.headerObj(resp), error: translate(resp.status, data) };
    }
    this.log?.(`[TaigaApi] GET ${url} -> ${resp.status}`);
    return { status: resp.status, headers: this.headerObj(resp), data: data as T };
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const base = `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    if (!query) return base;
    const params = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null)
      .flatMap(([k, v]) => Array.isArray(v) ? v.map(x => [k, x]) : [[k, v]]);
    if (!params.length) return base;
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
    return `${base}?${qs}`;
  }

  private headerObj(resp: FetchLikeResponse): Record<string,string> {
    const out: Record<string,string> = {};
    resp.headers.forEach((value: string, key: string) => { out[key] = value; });
    return out;
  }
}
