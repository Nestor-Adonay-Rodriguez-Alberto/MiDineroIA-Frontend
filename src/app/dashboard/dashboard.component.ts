import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../core/services/dashboard.service';
import { BudgetService } from '../core/services/budget.service';
import {
  DashboardResponse,
  CategoryDetailDto,
  ExpenseGroupDto,
  ExpenseDistributionDto,
} from '../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private budgetService = inject(BudgetService);

  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  loading = false;

  // Inline edit state
  editingCategoryId: number | null = null;
  editingValue: number | null = null;

  // Nombres de meses en español
  private monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // KPI cards
  kpiCards: { label: string; value: string; bg: string; border: string; labelColor: string; valueColor: string }[] = [];

  // Tablas
  incomeRows: CategoryDetailDto[] = [];
  incomeTotalBudget = 0;
  incomeTotalReal = 0;

  expenseSummaryRows: { category: string; budget: number; real: number }[] = [];
  expenseTotalBudget = 0;
  expenseTotalReal = 0;

  // Detalle por grupo
  expenseGroups: ExpenseGroupDto[] = [];

  // Gráfico de dona
  chartSegments: { label: string; value: number; color: string }[] = [];
  totalEgresos = 0;

  private chartColors = ['#43A047', '#E53935', '#1976D2', '#FB8C00', '#8E24AA', '#00ACC1', '#F4511E', '#6D4C41'];

  get selectedMonthLabel(): string {
    return `${this.monthNames[this.selectedMonth - 1]} ${this.selectedYear}`;
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  changeMonth(delta: number): void {
    this.selectedMonth += delta;
    if (this.selectedMonth > 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else if (this.selectedMonth < 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    }
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.dashboardService.getDashboard(this.selectedYear, this.selectedMonth).subscribe({
      next: (data) => {
        this.mapResponse(data);
        this.loading = false;
      },
      error: () => {
        this.mapEmpty();
        this.loading = false;
      },
    });
  }

  private mapResponse(data: DashboardResponse): void {
    // KPI cards
    const s = data.summary;
    this.kpiCards = [
      {
        label: 'SALDO',
        value: this.fmt(s.balance),
        bg: '#E8F5E9', border: '#2E7D32', labelColor: '#558B2F', valueColor: '#1B5E20',
      },
      {
        label: 'INGRESOS TOTALES',
        value: this.fmt(s.total_income),
        bg: '#E3F2FD', border: '#1976D2', labelColor: '#1565C0', valueColor: '#0D47A1',
      },
      {
        label: 'EGRESOS TOTALES',
        value: this.fmt(s.total_expenses),
        bg: '#FFEBEE', border: '#C62828', labelColor: '#B71C1C', valueColor: '#C62828',
      },
    ];

    // Ingresos
    this.incomeRows = data.income_detail ?? [];
    this.incomeTotalBudget = this.incomeRows.reduce((sum, r) => sum + r.budget, 0);
    this.incomeTotalReal = this.incomeRows.reduce((sum, r) => sum + r.real, 0);

    // Egresos resumen (un row por grupo)
    this.expenseGroups = data.expense_groups ?? [];
    this.expenseSummaryRows = this.expenseGroups.map(g => ({
      category: g.group_name,
      budget: g.categories.reduce((sum, c) => sum + c.budget, 0),
      real: g.categories.reduce((sum, c) => sum + c.real, 0),
    }));
    this.expenseTotalBudget = this.expenseSummaryRows.reduce((sum, r) => sum + r.budget, 0);
    this.expenseTotalReal = this.expenseSummaryRows.reduce((sum, r) => sum + r.real, 0);

    // Dona
    const dist = data.expense_distribution ?? [];
    this.totalEgresos = dist.reduce((sum, d) => sum + d.total, 0);
    this.chartSegments = dist.map((d, i) => ({
      label: d.group,
      value: d.total,
      color: this.chartColors[i % this.chartColors.length],
    }));
  }

  private mapEmpty(): void {
    this.kpiCards = [
      { label: 'SALDO', value: '$0.00', bg: '#E8F5E9', border: '#2E7D32', labelColor: '#558B2F', valueColor: '#1B5E20' },
      { label: 'INGRESOS TOTALES', value: '$0.00', bg: '#E3F2FD', border: '#1976D2', labelColor: '#1565C0', valueColor: '#0D47A1' },
      { label: 'EGRESOS TOTALES', value: '$0.00', bg: '#FFEBEE', border: '#C62828', labelColor: '#B71C1C', valueColor: '#C62828' },
    ];
    this.incomeRows = [];
    this.incomeTotalBudget = 0;
    this.incomeTotalReal = 0;
    this.expenseSummaryRows = [];
    this.expenseTotalBudget = 0;
    this.expenseTotalReal = 0;
    this.expenseGroups = [];
    this.chartSegments = [];
    this.totalEgresos = 0;
  }

  // ── Inline edit de presupuestos ─────────────────────

  startEdit(row: CategoryDetailDto): void {
    this.editingCategoryId = row.category_id;
    this.editingValue = row.budget > 0 ? row.budget : null;
  }

  cancelEdit(): void {
    this.editingCategoryId = null;
    this.editingValue = null;
  }

  saveBudget(row: CategoryDetailDto): void {
    const amount = this.editingValue ?? 0;
    if (amount < 0) { this.cancelEdit(); return; }

    this.budgetService.upsert({
      category_id: row.category_id,
      year: this.selectedYear,
      month: this.selectedMonth,
      amount,
    }).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadDashboard();
      },
      error: () => {
        this.cancelEdit();
      },
    });
  }

  onBudgetKeydown(event: KeyboardEvent, row: CategoryDetailDto): void {
    if (event.key === 'Enter') {
      this.saveBudget(row);
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  fmt(value: number): string {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Dona SVG ──────────────────────────────────────────

  getDonutPath(startAngle: number, endAngle: number, r = 75, cx = 100, cy = 100): string {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1  = cx + r  * Math.cos(toRad(startAngle - 90));
    const y1  = cy + r  * Math.sin(toRad(startAngle - 90));
    const x2  = cx + r  * Math.cos(toRad(endAngle - 90));
    const y2  = cy + r  * Math.sin(toRad(endAngle - 90));
    const ri  = 44;
    const xi1 = cx + ri * Math.cos(toRad(startAngle - 90));
    const yi1 = cy + ri * Math.sin(toRad(startAngle - 90));
    const xi2 = cx + ri * Math.cos(toRad(endAngle - 90));
    const yi2 = cy + ri * Math.sin(toRad(endAngle - 90));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ri} ${ri} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;
  }

  getSegments() {
    if (this.totalEgresos === 0) return [];
    let current = 0;
    return this.chartSegments.map((seg) => {
      const start = current;
      const slice = (seg.value / this.totalEgresos) * 360;
      current += slice;
      return {
        path: this.getDonutPath(start, current - 0.5),
        color: seg.color,
        label: seg.label,
        amount: this.fmt(seg.value),
      };
    });
  }
}
