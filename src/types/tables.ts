export type TableShape = 'rectangle' | 'circle' | 'round-rect';

export interface Table {
  id: number;
  name: string;
  description: string;
  capacity: number;
  is_active?: boolean;

  // Visual properties
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Width in px or relative units
  height: number; // Height in px or relative units
  shape: TableShape;
  zone: string; // 'indoor', 'outdoor', 'zone1', etc.
}

export interface CreateTableInput {
  name: string;
  description: string;
  capacity: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  shape?: TableShape;
  zone?: string;
}

export interface UpdateTableInput {
  name?: string;
  description?: string;
  capacity?: number;
  is_active?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  shape?: TableShape;
  zone?: string;
}
