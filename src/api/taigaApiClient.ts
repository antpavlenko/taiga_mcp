import { translate } from './errorTranslator';
import { NormalizedError } from '../models/types';

// Minimal fetch/response typing so we do not rely on DOM lib in tsconfig
export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  headers: { forEach(cb: (value: string, key: string) => void): void };
  text(): Promise<string>;
}
export type FetchLike = (url: string, init: { method: string; headers: Record<string,string>; body?: string }) => Promise<FetchLikeResponse>;

export interface GetOptions { query?: Record<string, unknown>; headers?: Record<string, string>; }
export interface WriteOptions { headers?: Record<string, string>; sensitive?: boolean; }

export class TaigaApiClient {
  private fetchFn: FetchLike;
  constructor(private baseUrl: string, private tokenProvider: () => Promise<string | undefined>, fetchImpl?: FetchLike, private log?: (msg: string) => void) {
    this.fetchFn = fetchImpl || (globalThis as any).fetch;
  }

  async get<T>(path: string, opts: GetOptions = {}) {
    return this.request<T>('GET', path, undefined, { headers: opts.headers }, opts.query);
  }

  async post<T>(path: string, body: any, opts: WriteOptions = {}) {
    return this.request<T>('POST', path, body, opts);
  }
  async patch<T>(path: string, body: any, opts: WriteOptions = {}) {
    return this.request<T>('PATCH', path, body, opts);
  }
  async delete<T = any>(path: string, opts: WriteOptions = {}) {
    return this.request<T>('DELETE', path, undefined, opts);
  }

  private async request<T>(method: 'GET'|'POST'|'PATCH'|'DELETE', path: string, body?: any, opts: WriteOptions = {}, query?: Record<string, unknown>): Promise<{ data?: T; error?: NormalizedError; status: number; headers: Record<string,string> }>{
    if (!this.baseUrl) {
      this.log?.(`[TaigaApi] No baseUrl configured; skipping ${method} ${path}`);
      return { status: 0, headers: {}, error: translate(0, null, new Error('No Taiga baseUrl configured')) };
    }
    const token = await this.tokenProvider();
    const url = this.buildUrl(path, query);
    const headers: Record<string,string> = { Accept: 'application/json', ...(opts.headers || {}) };
    let bodyStr: string | undefined = undefined;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      bodyStr = JSON.stringify(body);
    }
    if (token) headers.Authorization = `Bearer ${token}`;
    const logBody = bodyStr && !opts.sensitive ? ` body=${(bodyStr.length>200? bodyStr.slice(0,200)+'…' : bodyStr)}` : '';
    this.log?.(`[TaigaApi] ${method} ${url} (token=${token ? 'present' : 'missing'})${logBody}`);
    let resp: FetchLikeResponse;
    try {
      resp = await this.fetchFn(url, { method, headers, body: bodyStr });
    } catch (e) {
      this.log?.(`[TaigaApi] ${method} ${url} network error: ${(e as Error).message}`);
      return { status: 0, headers: {}, error: translate(0, null, (e as Error)) };
    }
    let data: unknown = undefined;
    const text = await resp.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!resp.ok) {
      this.log?.(`[TaigaApi] ${method} ${url} -> ${resp.status}`);
      return { status: resp.status, headers: this.headerObj(resp), error: translate(resp.status, data) };
    }
    this.log?.(`[TaigaApi] ${method} ${url} -> ${resp.status}`);
    // Verbose preview of response data for GETs to validate shapes without flooding logs
    try {
      if (method === 'GET') {
        const preview = this.previewData(data);
        if (preview) this.log?.(`[TaigaApi] preview ${path}: ${preview}`);
      }
    } catch { /* ignore preview errors */ }
    return { status: resp.status, headers: this.headerObj(resp), data: data as T };
  }

  // Create a small preview string for arrays/objects
  private previewData(data: unknown): string | undefined {
    if (data == null) return 'null';
    try {
      if (Array.isArray(data)) {
        const first = data[0];
        if (first && typeof first === 'object') {
          const keys = Object.keys(first as any).slice(0, 10);
          return `array(len=${data.length}) firstKeys=${keys.join(',')}`;
        }
        return `array(len=${data.length})`;
      }
      if (typeof data === 'object') {
        const obj = data as any;
        // If 'results' array is present
        if (Array.isArray(obj.results)) {
          const first = obj.results[0];
          const keys = first && typeof first === 'object' ? Object.keys(first).slice(0,10) : [];
          return `object{results: array(len=${obj.results.length}) firstKeys=${keys.join(',')}}`;
        }
        const keys = Object.keys(obj).slice(0, 20);
        return `object keys=${keys.join(',')}`;
      }
      // primitive
      return String(data).slice(0, 200);
    } catch {
      return undefined;
    }
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
