import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  selectedMonth = 'Marzo 2026';

  kpiCards = [
    {
      label: 'SALDO',
      value: '$1,720.00',
      metric: '▲ +5.2% vs mes anterior',
      bg: '#E8F5E9',
      border: '#2E7D32',
      labelColor: '#558B2F',
      valueColor: '#1B5E20',
    },
    {
      label: 'INGRESOS TOTALES',
      value: '$25,150.00',
      metric: '▲ +4.8% vs presupuesto',
      bg: '#E3F2FD',
      border: '#1976D2',
      labelColor: '#1565C0',
      valueColor: '#0D47A1',
    },
    {
      label: 'EGRESOS TOTALES',
      value: '$23,430.00',
      metric: '▲ +3.7% vs presupuesto',
      bg: '#FFEBEE',
      border: '#C62828',
      labelColor: '#B71C1C',
      valueColor: '#C62828',
    },
  ];

  incomeRows = [
    { category: 'Sueldo',  ppto: '$20,000', real: '$22,000' },
    { category: 'Negocio', ppto: '$3,000',  real: '$2,000'  },
    { category: 'Otros',   ppto: '$1,000',  real: '$1,150'  },
  ];

  expenseSummaryRows = [
    { category: 'Servicios', ppto: '$7,650', real: '$7,150' },
    { category: 'Deudas',    ppto: '$7,200', real: '$8,600' },
    { category: 'Ahorro',    ppto: '$2,600', real: '$3,100' },
    { category: 'Gastos',    ppto: '$5,150', real: '$4,580' },
  ];

  serviciosRows = [
    { category: 'Renta',       ppto: '$2,500', real: '$2,500' },
    { category: 'Seguro carro',ppto: '$1,800', real: '$1,800' },
    { category: 'Luz',         ppto: '$800',   real: '$800'   },
    { category: 'Agua',        ppto: null,     real: '$350'   },
    { category: 'Internet',    ppto: '$700',   real: '$700'   },
  ];

  gastosRows = [
    { category: 'Despensa',       ppto: '$1,500', real: '$1,500' },
    { category: 'Compras',        ppto: null,     real: '$800'   },
    { category: 'Comidas',        ppto: null,     real: '$1,200' },
    { category: 'Entretenimiento',ppto: null,     real: '$580'   },
    { category: 'Salidas',        ppto: null,     real: '$500'   },
  ];

  chartSegments = [
    { label: 'Servicios', value: 7150, color: '#43A047', amount: '$7,150' },
    { label: 'Deudas',    value: 8600, color: '#E53935', amount: '$8,600' },
    { label: 'Ahorro',    value: 3100, color: '#1976D2', amount: '$3,100' },
    { label: 'Gastos',    value: 4580, color: '#FB8C00', amount: '$4,580' },
  ];

  readonly totalEgresos = 23430;

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
    let current = 0;
    return this.chartSegments.map((seg) => {
      const start = current;
      const slice = (seg.value / this.totalEgresos) * 360;
      current += slice;
      return {
        path: this.getDonutPath(start, current - 0.5),
        color: seg.color,
        label: seg.label,
        amount: seg.amount,
      };
    });
  }
}
