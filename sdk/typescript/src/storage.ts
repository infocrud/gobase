import type { GoBaseResponse, StorageObject, SignedUrlResponse } from './types';
import type { GoBaseAuth } from './auth';

export class GoBaseStorage {
  private baseUrl: string;
  private auth: GoBaseAuth;

  constructor(baseUrl: string, auth: GoBaseAuth) {
    this.baseUrl = baseUrl;
    this.auth = auth;
  }

  /** Upload a file. */
  async upload(bucket: string, path: string, file: File | Blob): Promise<GoBaseResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    const token = this.auth.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  }

  /** Download a file as a Blob. */
  async download(bucket: string, path: string): Promise<Blob> {
    const headers: Record<string, string> = {};
    const token = this.auth.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}/storage/v1/object/${bucket}/${path}`, {
      headers,
    });
    return res.blob();
  }

  /** Delete a file. */
  async remove(bucket: string, path: string): Promise<GoBaseResponse> {
    const res = await fetch(`${this.baseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'DELETE',
      headers: this.auth.authHeaders(),
    });
    return res.json();
  }

  /** List files in a bucket. */
  async list(bucket: string, prefix?: string): Promise<GoBaseResponse<{ objects: StorageObject[]; count: number }>> {
    const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    const res = await fetch(`${this.baseUrl}/storage/v1/object/${bucket}${query}`, {
      headers: this.auth.authHeaders(),
    });
    return res.json();
  }

  /** Generate a presigned download URL. */
  async createSignedUrl(bucket: string, path: string, expiresIn?: string): Promise<GoBaseResponse<SignedUrlResponse>> {
    const res = await fetch(`${this.baseUrl}/storage/v1/sign/${bucket}/${path}`, {
      method: 'POST',
      headers: this.auth.authHeaders(),
      body: JSON.stringify({ expires_in: expiresIn || '1h' }),
    });
    return res.json();
  }

  /** Generate a presigned upload URL. */
  async createSignedUploadUrl(bucket: string, path: string, expiresIn?: string): Promise<GoBaseResponse<SignedUrlResponse>> {
    const res = await fetch(`${this.baseUrl}/storage/v1/sign/upload/${bucket}/${path}`, {
      method: 'POST',
      headers: this.auth.authHeaders(),
      body: JSON.stringify({ expires_in: expiresIn || '1h' }),
    });
    return res.json();
  }
}
