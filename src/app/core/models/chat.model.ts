export interface ChatRequest {
  message: string;
  image_base64: string | null;
}

export interface BudgetInfo {
  budget: number;
  spent: number;
  remaining: number;
}

export interface CategoryAlternative {
  category_name: string;
  category_id: number;
}

export interface ChatResponse {
  intent: string;
  transaction_id: number | null;
  message: string;
  data: any;
  needs_confirmation: boolean;
  budget_info: BudgetInfo | null;
  suggested_alternatives: CategoryAlternative[] | null;
}

export interface ChatMessage {
  id: number;
  message_type: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total_count: number;
  page: number;
  page_size: number;
}
