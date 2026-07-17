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

// Mirrors the check constraint on organization_members.role.
export type OrganizationRole = "owner" | "admin" | "operator" | "viewer";

export interface OrgMember {
  organization_id: string;
  organization_name: string;
  user_id: string;
  email: string | null;
  role: OrganizationRole;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  organization_id: string;
  role: OrganizationRole;
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
