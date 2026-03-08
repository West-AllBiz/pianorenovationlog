import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { samplePianos, sampleExpenses } from '@/data/sampleData';
import { PIANO_TYPE_LABELS } from '@/types/piano';

export default function Reports() {
  const data = useMemo(() => {
    const totalCost = sampleExpenses.reduce((s, e) => s + e.amount, 0);
    const soldPianos = samplePianos.filter(p => p.soldPrice);
    const totalRevenue = soldPianos.reduce((s, p) => s + (p.soldPrice || 0), 0);
    const totalProfit = totalRevenue - soldPianos.reduce((s, p) => {
      const cost = sampleExpenses.filter(e => e.pianoId === p.id).reduce((sum, e) => sum + e.amount, 0);
      return s + cost;
    }, 0);

    const byCategory: Record<string, number> = {};
    sampleExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

    const byType: Record<string, number> = {};
    samplePianos.forEach(p => { byType[p.pianoType] = (byType[p.pianoType] || 0) + 1; });

    const pianoProfit = samplePianos
      .filter(p => p.soldPrice || p.askingPrice)
      .map(p => {
        const cost = sampleExpenses.filter(e => e.pianoId === p.id).reduce((s, e) => s + e.amount, 0);
        const revenue = p.soldPrice || p.askingPrice || 0;
        return { name: `${p.brand} ${p.model}`, cost, revenue, profit: revenue - cost, isSold: !!p.soldPrice };
      })
      .sort((a, b) => b.profit - a.profit);

    return { totalCost, totalRevenue, totalProfit, byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]), byType: Object.entries(byType), pianoProfit };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Reports</h1>
        <p className="text-muted-foreground text-sm mb-6">Financial summaries and analytics</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="text-3xl font-bold font-heading">${data.totalCost.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-bold font-heading text-success">${data.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Net Profit (Sold)</p>
          <p className={`text-3xl font-bold font-heading ${data.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${data.totalProfit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expenses by category */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-heading font-semibold mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {data.byCategory.map(([cat, amount]) => {
              const pct = (amount / data.totalCost) * 100;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize">{cat}</span>
                    <span className="font-medium">${amount.toLocaleString()} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profit by piano */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-heading font-semibold mb-4">Profit by Piano</h3>
          <div className="space-y-3">
            {data.pianoProfit.map((p) => (
              <div key={p.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Cost: ${p.cost.toLocaleString()} · {p.isSold ? 'Sold' : 'Est.'}: ${p.revenue.toLocaleString()}
                  </p>
                </div>
                <span className={`text-sm font-bold ${p.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {p.profit >= 0 ? '+' : ''}${p.profit.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory by type */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-heading font-semibold mb-4">Inventory by Type</h3>
          <div className="space-y-2">
            {data.byType.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{PIANO_TYPE_LABELS[type as keyof typeof PIANO_TYPE_LABELS] || type}</span>
                <span className="font-medium text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
