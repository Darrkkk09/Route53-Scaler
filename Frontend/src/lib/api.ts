const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface HostedZone {
  id: number;
  name: string;
  comment: string | null;
  private_zone: boolean;
}

export interface HostedZoneCreateInput {
  name: string;
  comment?: string;
  private_zone?: boolean;
}

export interface HostedZoneUpdateInput {
  comment?: string;
  private_zone?: boolean;
}

export interface DNSRecord {
  id: number;
  zone_id: number;
  name: string;
  type: string;
  ttl: number;
  value: string;
}

export interface DNSRecordCreateInput {
  name: string;
  type: string;
  ttl: number;
  value: string;
}

export interface DNSRecordUpdateInput {
  name?: string;
  type?: string;
  ttl?: number;
  value?: string;
}

// Custom error class to handle API failures gracefully
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail || `API error with status ${status}`);
    this.status = status;
    this.detail = detail;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || JSON.stringify(errorJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new ApiError(response.status, errorDetail);
  }
  
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

export const api = {
  // Hosted Zones CRUD
  async listHostedZones(filters?: { name?: string; private_zone?: boolean }): Promise<HostedZone[]> {
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.private_zone !== undefined) params.append('private_zone', String(filters.private_zone));

    const response = await fetch(`${API_BASE_URL}/zones?${params.toString()}`);
    return handleResponse<HostedZone[]>(response);
  },

  async getHostedZone(id: number): Promise<HostedZone> {
    const response = await fetch(`${API_BASE_URL}/zones/${id}`);
    return handleResponse<HostedZone>(response);
  },

  async createHostedZone(input: HostedZoneCreateInput): Promise<HostedZone> {
    const response = await fetch(`${API_BASE_URL}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<HostedZone>(response);
  },

  async updateHostedZone(id: number, input: HostedZoneUpdateInput): Promise<HostedZone> {
    const response = await fetch(`${API_BASE_URL}/zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<HostedZone>(response);
  },

  async deleteHostedZone(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/zones/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  // DNS Records CRUD (Scoped to Hosted Zone)
  async listDNSRecords(zoneId: number, filters?: { name?: string; type?: string }): Promise<DNSRecord[]> {
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.type) params.append('type', filters.type);

    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}/records?${params.toString()}`);
    return handleResponse<DNSRecord[]>(response);
  },

  async getDNSRecord(zoneId: number, recordId: number): Promise<DNSRecord> {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}/records/${recordId}`);
    return handleResponse<DNSRecord>(response);
  },

  async createDNSRecord(zoneId: number, input: DNSRecordCreateInput): Promise<DNSRecord> {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<DNSRecord>(response);
  },

  async updateDNSRecord(zoneId: number, recordId: number, input: DNSRecordUpdateInput): Promise<DNSRecord> {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}/records/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<DNSRecord>(response);
  },

  async deleteDNSRecord(zoneId: number, recordId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}/records/${recordId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};
