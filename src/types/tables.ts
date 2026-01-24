
export interface Table {
    id: number;
    name: string;
    description: string;
    capacity: number;
    is_active?: boolean;
}

export interface CreateTableInput {
    name: string;
    description: string;
    capacity: number;
}

export interface UpdateTableInput {
    name?: string;
    description?: string;
    capacity?: number;
    is_active?: boolean;
}
