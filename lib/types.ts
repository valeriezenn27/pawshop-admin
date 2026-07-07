export type ProductStatus = "active" | "inactive";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  organization_id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image_url: string;
  description: string;
}

export interface OrganizationOption {
  id: string;
  name: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus | "all";
}
