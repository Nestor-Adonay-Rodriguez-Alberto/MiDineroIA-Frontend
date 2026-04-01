import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Transaction {
  id: number;
  monto: string;
  categoria: string;
  comercio: string;
  fecha: string;
  presupuestoRestante?: string;
  presupuestoTotal?: string;
  presupuestoPct?: number;
  tipo: 'normal' | 'ai';
  confirmado: boolean;
}

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent {
  today = 'Hoy, 29 marzo 2026';

  transactions: Transaction[] = [
    {
      id: 1,
      monto: '$85.00',
      categoria: 'Despensa',
      comercio: 'Super Selectos',
      fecha: '29/03/2026',
      presupuestoRestante: '$1,115.00',
      presupuestoTotal: '$1,200.00',
      presupuestoPct: 92.9,
      tipo: 'normal',
      confirmado: false,
    },
    {
      id: 2,
      monto: '$350.00',
      categoria: 'Servicios',
      comercio: 'Shell',
      fecha: '29/03/2026',
      presupuestoRestante: '$6,650.00',
      presupuestoTotal: '$7,000.00',
      presupuestoPct: 95,
      tipo: 'normal',
      confirmado: false,
    },
    {
      id: 3,
      monto: '$1,250.00',
      categoria: 'Gastos',
      comercio: 'Supermercado XYZ',
      fecha: '28/03/2026',
      tipo: 'ai',
      confirmado: false,
    },
  ];

  confirmar(id: number) {
    const t = this.transactions.find((x) => x.id === id);
    if (t) t.confirmado = true;
  }
}
