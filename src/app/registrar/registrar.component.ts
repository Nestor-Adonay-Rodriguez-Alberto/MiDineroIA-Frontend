import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService } from '../core/services/chat.service';
import { TransactionService } from '../core/services/transaction.service';
import { BudgetService } from '../core/services/budget.service';
import { AuthService } from '../core/services/auth.service';
import { ChatResponse, TransactionInfoDto } from '../core/models/chat.model';
import { CategoryDto, CategoryGroupDto } from '../core/models/transaction.model';
import { environment } from '../../environments/environment';

export interface UiMessage {
  id?: number;
  type: 'user' | 'ai' | 'typing' | 'date-separator';
  content: string;
  imageUrl?: string | null;
  transactionId?: number | null;
  // Para mensajes nuevos (POST /api/chat)
  chatResponse?: ChatResponse | null;
  // Para historial: datos reales de la transacción
  transactionInfo?: TransactionInfoDto | null;
  confirmed?: boolean;
  confirming?: boolean;
  editing?: boolean;
  editCategoryId?: number;
  editAmount?: number;
  editDescription?: string;
  editGroupId?: number | null;
  editingBudgets?: boolean;
  editBudgetAmounts?: { [categoryId: number]: number };
  time?: string;
  dateLabel?: string;
}

// Converts UTC ISO string → CST (GMT-6)
function toCst(isoString: string): Date {
  const utc = new Date(isoString);
  return new Date(utc.getTime() - 6 * 60 * 60 * 1000);
}

function formatTime(isoString: string): string {
  const d = toCst(isoString);
  return d.toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateLabel(isoString: string): string {
  const d = toCst(isoString);
  const today = toCst(new Date().toISOString());
  const yesterday = toCst(new Date().toISOString());
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Hoy';
  if (sameDay(d, yesterday)) return 'Ayer';
  return d.toLocaleDateString('es-SV', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent implements OnInit {
  @ViewChild('chatBottom') chatBottom!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private chatService = inject(ChatService);
  private transactionService = inject(TransactionService);
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);

  messages: UiMessage[] = [];

  get userInitials(): string {
    const name = this.authService.getUser()?.name ?? '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() ?? '?';
  }
  loadingHistory = true;
  sending = false;
  inputText = '';
  imageError = '';

  pendingImagePreview: string | null = null;
  pendingImageBase64: string | null = null;

  categoryGroups: CategoryGroupDto[] = [];
  allCategories: CategoryDto[] = [];

  ngOnInit(): void {
    this.transactionService.getCategories().subscribe({
      next: (res) => {
        this.categoryGroups = res ?? [];
        this.allCategories = this.categoryGroups.flatMap((g) => g.categories);
      },
      error: () => {},
    });

    this.chatService.getHistory(1, 100).subscribe({
      next: (res) => {
        const sorted = [...res.messages].reverse();
        const result: UiMessage[] = [];
        let lastDateLabel = '';
        // Flag para ocultar el AI_RESPONSE que sigue a un USER con transacción
        let skipNextAiResponse = false;

        for (const m of sorted) {
          const dateLabel = formatDateLabel(m.created_at);
          if (dateLabel !== lastDateLabel) {
            result.push({ type: 'date-separator', content: dateLabel });
            lastDateLabel = dateLabel;
          }

          if (m.message_type === 'AI_RESPONSE') {
            // Si el USER anterior tenía transacción, la tarjeta ya se mostró allí → omitir este AI_RESPONSE
            if (skipNextAiResponse) {
              skipNextAiResponse = false;
              continue;
            }
            // AI_RESPONSE sin transacción asociada (saludos, presupuestos, consultas)
            let parsed: ChatResponse | null = null;
            try { parsed = JSON.parse(m.content ?? ''); } catch {}
            const isBudget = parsed?.intent === 'SET_BUDGET' && parsed?.needs_confirmation;
            result.push({
              id: m.id,
              type: 'ai',
              content: parsed ? parsed.message : (m.content ?? ''),
              chatResponse: isBudget ? parsed : null,
              transactionId: null,
              confirmed: false,
              time: formatTime(m.created_at),
            });

          } else {
            // USER_TEXT o USER_IMAGE
            const hasTransaction = !!m.transaction;
            result.push({
              id: m.id,
              type: 'user',
              content: m.content ?? '',
              imageUrl: m.image_url
                ? (m.image_url.startsWith('http') ? m.image_url : `${environment.apiUrl}${m.image_url}`)
                : null,
              transactionId: m.transaction?.id ?? null,
              transactionInfo: m.transaction ?? null,
              confirmed: m.transaction?.is_confirmed ?? false,
              time: formatTime(m.created_at),
            });
            if (hasTransaction) {
              skipNextAiResponse = true;
            }
          }
        }

        this.messages = result;
        this.loadingHistory = false;
        this.scrollToBottom('instant');
      },
      error: () => { this.loadingHistory = false; },
    });
  }

  // ── Send message ─────────────────────────────────────────────────────────

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.sending) return;

    const imagePreview = this.pendingImagePreview;
    const imageBase64 = this.pendingImageBase64;

    this.messages.push({
      type: 'user',
      content: text,
      imageUrl: imagePreview ?? null,
      time: formatTime(new Date().toISOString()),
    });
    this.inputText = '';
    this.pendingImagePreview = null;
    this.pendingImageBase64 = null;
    this.sending = true;
    this.scrollToBottom('smooth');

    const typingMsg: UiMessage = { type: 'typing', content: '' };
    this.messages.push(typingMsg);

    this.chatService.sendMessage({ message: text, image_base64: imageBase64 }).subscribe({
      next: (res) => {
        this.messages = this.messages.filter((m) => m !== typingMsg);
        this.messages.push({
          type: 'ai',
          content: res.message,
          chatResponse: res,
          transactionId: res.transaction_id,
          confirmed: false,
          time: formatTime(new Date().toISOString()),
        });
        this.sending = false;
        this.scrollToBottom('smooth');
      },
      error: () => {
        this.messages = this.messages.filter((m) => m !== typingMsg);
        this.messages.push({ type: 'ai', content: 'Algo salió mal, intenta de nuevo.', chatResponse: null });
        this.sending = false;
        this.scrollToBottom('smooth');
      },
    });
  }

  cancelPendingImage(): void {
    this.pendingImagePreview = null;
    this.pendingImageBase64 = null;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  // ── Image upload ─────────────────────────────────────────────────────────

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.imageError = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.imageError = 'Solo se permiten imágenes JPG, PNG o WEBP.';
      this.fileInput.nativeElement.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      this.imageError = 'La imagen debe ser menor a 5MB.';
      this.fileInput.nativeElement.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.pendingImagePreview = dataUrl;
      this.pendingImageBase64 = dataUrl.split(',')[1];
    };
    reader.readAsDataURL(file);
    this.fileInput.nativeElement.value = '';
  }

  // ── Confirm ──────────────────────────────────────────────────────────────

  confirmar(msg: UiMessage): void {
    if (!msg.transactionId || msg.confirming) return;
    msg.confirming = true;

    this.transactionService.confirm(msg.transactionId).subscribe({
      next: () => { msg.confirmed = true; msg.confirming = false; },
      error: () => { msg.confirming = false; },
    });
  }

  // ── Edit ─────────────────────────────────────────────────────────────────

  openEdit(msg: UiMessage): void {
    msg.editing = true;
    const catId = msg.chatResponse?.data?.category_id
      ?? this.allCategories.find(c => c.name === msg.transactionInfo?.category_name)?.id
      ?? undefined;
    msg.editCategoryId = catId;
    msg.editAmount = msg.chatResponse?.data?.amount ?? msg.transactionInfo?.amount ?? undefined;
    msg.editDescription = msg.chatResponse?.data?.description ?? msg.transactionInfo?.description ?? '';
    // Pre-seleccionar el grupo al que pertenece la categoría actual
    msg.editGroupId = catId
      ? (this.categoryGroups.find(g => g.categories.some(c => c.id === catId))?.id ?? null)
      : null;
  }

  getCategoriesForGroup(groupId: number | string | null | undefined): CategoryDto[] {
    if (!groupId) return [];
    const id = Number(groupId);
    return this.categoryGroups.find(g => g.id === id)?.categories ?? [];
  }

  cancelEdit(msg: UiMessage): void {
    msg.editing = false;
  }

  saveEdit(msg: UiMessage): void {
    if (!msg.transactionId || !msg.editCategoryId || !msg.editAmount) return;
    msg.confirming = true;

    this.transactionService.update(msg.transactionId, {
      category_id: Number(msg.editCategoryId),
      amount: Number(msg.editAmount),
      description: msg.editDescription ?? '',
    }).subscribe({
      next: () => {
        this.transactionService.confirm(msg.transactionId!).subscribe({
          next: () => {
            const catId = Number(msg.editCategoryId);
            const amt = Number(msg.editAmount);
            const catName = this.allCategories.find((c) => c.id === catId)?.name
              ?? msg.chatResponse?.data?.category_name
              ?? msg.transactionInfo?.category_name
              ?? '';
            if (msg.chatResponse) {
              msg.chatResponse = {
                ...msg.chatResponse,
                data: {
                  ...msg.chatResponse.data,
                  category_id: catId,
                  category_name: catName,
                  amount: amt,
                  description: msg.editDescription ?? '',
                },
              };
            }
            if (msg.transactionInfo) {
              msg.transactionInfo = {
                ...msg.transactionInfo,
                amount: amt,
                category_name: catName,
                description: msg.editDescription ?? '',
              };
            }
            msg.confirmed = true;
            msg.editing = false;
            msg.confirming = false;
          },
          error: () => { msg.confirming = false; },
        });
      },
      error: () => { msg.confirming = false; },
    });
  }

  // ── Budget edit ──────────────────────────────────────────────────────────

  openBudgetEdit(msg: UiMessage): void {
    msg.editingBudgets = true;
    msg.editBudgetAmounts = {};
    for (const b of msg.chatResponse?.data?.budgets ?? []) {
      msg.editBudgetAmounts[b.category_id] = b.amount;
    }
  }

  cancelBudgetEdit(msg: UiMessage): void {
    msg.editingBudgets = false;
  }

  saveBudgetEdit(msg: UiMessage): void {
    const budgets = msg.chatResponse?.data?.budgets;
    if (!budgets?.length || !msg.editBudgetAmounts) return;
    msg.confirming = true;

    const requests = budgets.map((b: any) =>
      this.budgetService.upsert({
        category_id: b.category_id,
        year: b.year,
        month: b.month,
        amount: msg.editBudgetAmounts![b.category_id] ?? b.amount,
      })
    );

    let completed = 0;
    for (const req of requests) {
      req.subscribe({
        next: () => {
          completed++;
          if (completed === requests.length) {
            // Update displayed amounts
            for (const b of budgets) {
              b.amount = msg.editBudgetAmounts![b.category_id] ?? b.amount;
            }
            msg.confirmed = true;
            msg.editingBudgets = false;
            msg.confirming = false;
          }
        },
        error: () => { msg.confirming = false; },
      });
    }
  }

  // ── Suggested alternative ────────────────────────────────────────────────

  selectAlternative(msg: UiMessage, categoryId: number, categoryName: string): void {
    if (!msg.transactionId || msg.confirming) return;
    msg.confirming = true;

    this.transactionService.update(msg.transactionId, {
      category_id: categoryId,
      amount: msg.chatResponse?.data?.amount ?? 0,
      description: msg.chatResponse?.data?.description ?? '',
    }).subscribe({
      next: () => {
        if (msg.chatResponse?.data) {
          msg.chatResponse.data.category_id = categoryId;
          msg.chatResponse.data.category_name = categoryName;
        }
        msg.confirmed = true;
        msg.confirming = false;
      },
      error: () => { msg.confirming = false; },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  hasConfirmCard(msg: UiMessage): boolean {
    // Mensaje del historial (tipo 'user'): tiene transactionInfo
    if (msg.type === 'user' && msg.transactionInfo) {
      return true; // siempre mostrar tarjeta; confirmed se controla dentro
    }
    // Mensaje nuevo (tipo 'ai'): controlado por chatResponse
    if (msg.type === 'ai' && msg.chatResponse?.needs_confirmation && msg.chatResponse?.intent === 'REGISTER_TRANSACTION') {
      return !msg.confirmed;
    }
    return false;
  }

  hasBudgetConfirmCard(msg: UiMessage): boolean {
    return !!(
      msg.chatResponse?.needs_confirmation &&
      msg.chatResponse?.intent === 'SET_BUDGET' &&
      !msg.confirmed
    );
  }

  formatAmount(amount: number): string {
    if (amount == null) return '$0.00';
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private scrollToBottom(behavior: 'instant' | 'smooth' = 'instant'): void {
    setTimeout(() => {
      try {
        const el = this.chatBottom?.nativeElement;
        if (el) el.scrollIntoView({ behavior });
      } catch {}
    }, 100);
  }
}
