export interface SummaryDto {
  total_income: number;
  total_expenses: number;
  balance: number;
}

export interface CategoryDetailDto {
  category: string;
  budget: number;
  real: number;
}

export interface ExpenseGroupDto {
  group_name: string;
  categories: CategoryDetailDto[];
}

export interface ExpenseDistributionDto {
  group: string;
  total: number;
  percentage: number;
}

export interface DashboardResponse {
  summary: SummaryDto;
  income_detail: CategoryDetailDto[];
  expense_groups: ExpenseGroupDto[];
  expense_distribution: ExpenseDistributionDto[];
}
