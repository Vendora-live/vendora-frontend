export interface ProductImage {
    id: number;
    imageUrl: string;
    displayOrder: number;
    isPrimary: boolean;
}

export interface Product {
    id: number;
    createdAt?: string;
    updatedAt?: string;
    name: string;
    description: string;
    primaryImageUrl?: string;
    images: ProductImage[];
    sku: string;
    unitPrice: number;
    stockQuantity: number;
    storeId: number;
    categoryName: string;
}

export interface ProductRequest {
    name: string;
    description: string;
    sku: string;
    unitPrice: number;
    stockQuantity: number;
    categoryId: number | null;
    storeId: number;
}
