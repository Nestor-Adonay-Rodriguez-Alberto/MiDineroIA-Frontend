import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  selectedMonth = 'Marzo 2026';

  kpiCards = [
    {
      label: 'SALDO',
      value: '$3,650.00',
      metric: '▲ +2.7% vs mes anterior',
      bg: '#E8F5E9',
      border: '#2E7D32',
      labelColor: '#558B2F',
      valueColor: '#1B5E20',
    },
    {
      label: 'INGRESOS TOTALES',
      value: '$33,900.00',
      metric: '▲ +2.7% vs presupuesto',
      bg: '#E3F2FD',
      border: '#1976D2',
      labelColor: '#1565C0',
      valueColor: '#0D47A1',
    },
    {
      label: 'EGRESOS TOTALES',
      value: '$30,250.00',
      metric: '▲ +2.4% vs presupuesto',
      bg: '#FFEBEE',
      border: '#C62828',
      labelColor: '#B71C1C',
      valueColor: '#C62828',
    },
  ];

  incomeRows: { category: string; ppto: string; real: string; highlight: boolean }[] = [
    { category: 'Sueldo',      ppto: '25,000.00', real: '25,500.00', highlight: true  },
    { category: 'Negocio',     ppto: '4,000.00',  real: '3,800.00',  highlight: true  },
    { category: 'Freelance',   ppto: '2,500.00',  real: '2,900.00',  highlight: true  },
    { category: 'Inversiones', ppto: '1,200.00',  real: '1,400.00',  highlight: true  },
    { category: 'Otros',       ppto: '300.00',    real: '300.00',    highlight: false },
  ];

  expenseSummaryRows: { category: string; ppto: string; real: string }[] = [
    { category: 'Servicios', ppto: '9,550.00',  real: '9,250.00'  },
    { category: 'Deudas',    ppto: '6,000.00',  real: '6,500.00'  },
    { category: 'Ahorro',    ppto: '4,000.00',  real: '4,500.00'  },
    { category: 'Gastos',    ppto: '7,500.00',  real: '7,200.00'  },
    { category: 'Viajes',    ppto: '2,500.00',  real: '2,800.00'  },
  ];

  serviciosRows: { category: string; ppto: string | null; real: string; highlight: boolean; overBudget: boolean }[] = [
    { category: 'Renta',           ppto: '5,300.00', real: '5,000.00', highlight: true,  overBudget: false },
    { category: 'Seguro del carro', ppto: '1,100.00', real: '1,100.00', highlight: false, overBudget: false },
    { category: 'Recibo de Luz',   ppto: '700.00',   real: '750.00',   highlight: false, overBudget: true  },
    { category: 'Seguro de salud', ppto: '900.00',   real: '900.00',   highlight: false, overBudget: false },
    { category: 'Recibo de Agua',  ppto: '400.00',   real: '350.00',   highlight: true,  overBudget: false },
    { category: 'Gimnasio',        ppto: '400.00',   real: '400.00',   highlight: false, overBudget: false },
    { category: 'Recibo de Gas',   ppto: '300.00',   real: '300.00',   highlight: false, overBudget: false },
    { category: 'Internet',        ppto: '200.00',   real: '200.00',   highlight: false, overBudget: false },
    { category: 'Streaming',       ppto: '150.00',   real: '150.00',   highlight: false, overBudget: false },
    { category: 'Telefonía Móvil', ppto: '100.00',   real: '100.00',   highlight: false, overBudget: false },
    { category: '-',               ppto: null,       real: '-',        highlight: false, overBudget: false },
  ];

  gastosRows: { category: string; ppto: string | null; real: string; highlight: boolean; overBudget: boolean }[] = [
    { category: 'Despensa',         ppto: '1,600.00', real: '1,600.00', highlight: false, overBudget: false },
    { category: 'Compras',          ppto: '800.00',   real: '950.00',   highlight: false, overBudget: true  },
    { category: 'Cine',             ppto: '600.00',   real: '300.00',   highlight: true,  overBudget: false },
    { category: 'Salidas',          ppto: '1,100.00', real: '1,000.00', highlight: true,  overBudget: false },
    { category: 'Comidas',          ppto: '800.00',   real: '700.00',   highlight: true,  overBudget: false },
    { category: 'Amazon',           ppto: '700.00',   real: '850.00',   highlight: false, overBudget: true  },
    { category: 'Entretenimiento',  ppto: '500.00',   real: '500.00',   highlight: false, overBudget: false },
    { category: 'Regalos',          ppto: '600.00',   real: '400.00',   highlight: true,  overBudget: false },
    { category: 'Cerveza',          ppto: '200.00',   real: '400.00',   highlight: false, overBudget: true  },
    { category: 'Transporte',       ppto: '300.00',   real: '250.00',   highlight: true,  overBudget: false },
    { category: 'Cuidado personal', ppto: '300.00',   real: '250.00',   highlight: true,  overBudget: false },
  ];

  chartSegments = [
    { label: 'Servicios', value: 9250,  color: '#43A047' },
    { label: 'Deudas',    value: 6500,  color: '#8BC34A' },
    { label: 'Ahorro',    value: 4500,  color: '#C5E1A5' },
    { label: 'Gastos',    value: 7200,  color: '#558B2F' },
    { label: 'Viajes',    value: 2800,  color: '#AED581' },
  ];

  readonly totalEgresos = 30250;

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

  getLabelPosition(startAngle: number, endAngle: number, r = 92, cx = 100, cy = 100): { x: number; y: number } {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const mid = (startAngle + endAngle) / 2;
    return {
      x: cx + r * Math.cos(toRad(mid - 90)),
      y: cy + r * Math.sin(toRad(mid - 90)),
    };
  }

  getSegments() {
    let current = 0;
    return this.chartSegments.map((seg) => {
      const start = current;
      const slice = (seg.value / this.totalEgresos) * 360;
      current += slice;
      const mid = start + slice / 2;
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const labelR = 90;
      return {
        path: this.getDonutPath(start, current - 0.5),
        color: seg.color,
        label: seg.label,
        pct: Math.round((seg.value / this.totalEgresos) * 100),
        labelX: 100 + labelR * Math.cos(toRad(mid - 90)),
        labelY: 100 + labelR * Math.sin(toRad(mid - 90)),
      };
    });
  }
}
