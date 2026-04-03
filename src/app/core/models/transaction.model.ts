export interface TransactionUpdateRequest {
  category_id: number;
  amount: number;
  description: string;
}

export interface BudgetRequest {
  category_id: number;
  year: number;
  month: number;
  amount: number;
}

export interface CategoryDto {
  id: number;
  name: string;
}

export interface CategoryGroupDto {
  name: string;
  type: string;
  categories: CategoryDto[];
}

export interface CategoriesResponse {
  groups: CategoryGroupDto[];
}
