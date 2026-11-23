export type GeofenceType = 'polygon' | 'circle';
export type GeofenceStatus = 'active' | 'inactive';

export interface GeofenceCreatePayload {
  name: string;
  type: GeofenceType;
  coordinates: number[][][] | number[][];
  radius?: number;
  status: GeofenceStatus;
  projectId: string;
  [key: string]: unknown;
}

export type GeofenceUpdatePayload = Partial<GeofenceCreatePayload>;

export interface GeofenceRecord {
  id: string;
  name?: string;
  type?: GeofenceType;
  coordinates?: number[][][] | number[][];
  radius?: number;
  status?: GeofenceStatus;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface GeofenceListResponse {
  geofences?: GeofenceRecord[];
  data?: GeofenceRecord[];
  page?: number;
  size?: number;
  total?: number;
  [key: string]: unknown;
}

export interface GeofenceStatusResponse {
  isInside?: boolean;
  status?: string;
  [key: string]: unknown;
}
