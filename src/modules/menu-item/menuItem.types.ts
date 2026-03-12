export interface CreateMenuItemInput {
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    is_available?: boolean;
}

export interface UpdateMenuItemInput {
    name?: string;
    description?: string;
    price?: number;
    image_url?: string;
    is_available?: boolean;
}