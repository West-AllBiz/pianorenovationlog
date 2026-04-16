import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePianos } from '@/hooks/usePianos';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PIANO_TYPE_LABELS } from '@/types/piano';

export default function Reports() {
  const { data: pianos = [], isLoading: pianosLoading } = usePianos();

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['all_expenses'],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('*');
      return data ?? [];
    },
  });

  const { data: allClientRecords = [] } = useQuery({
    queryKey: ['all_client_records'],
    queryFn: async () => {
      const { data } = await supabase.from('client_records').select('*');
      return data ?? [];
    },
  });

  const { data: allDonationRecords = [] } = useQuery({
    queryKey: ['all_donation_records'],
    queryFn: async () => {
      const { data } = await supabase.from('donation_records').select('*');
      return data ?? [];
    },
  });

  const data = useMemo(() => {
    const businessPianos = pianos.filter(p => p.ownership_category === 'business_inventory');

    // Build profitability from expenses table
    const pianoProfit = businessPianos.map(p => {
      const exp = allExpenses.find(e => e.piano_id === p.id);
      const totalCost = (exp?.purchase_price || 0) + (exp?.parts_cost || 0) + (exp?.labor_cost || 0) + (exp?.moving_cost || 0) + (exp?.marketing_cost || 0);
      const estSale = exp?.estimated_sale_price || p.asking_price || 0;
      return {
        name: `${p.brand} ${p.model || ''}`.trim(),
        id: p.inventory_id,
        cost: totalCost,
        estimatedSale: estSale,
        profit: estSale - totalCost,
      };
    }).sort((a, b) => b.profit - a.profit);

    const totalInvested = pianoProfit.reduce((s, p) => s + p.cost, 0);
    const totalProjectedProfit = pianoProfit.reduce((s, p) => s + p.profit, 0);

    // Client work
    const clientJobs = allClientRecords.map(cr => {
      const piano = pianos.find(p => p.id === cr.piano_id);
      return {
        pianoId: cr.piano_id,
        pianoName: piano ? `${piano.brand} ${piano.model || ''}`.trim() : cr.piano_id,
        clientName: cr.client_name,
        estimate: cr.estimate,
        depositReceived: cr.deposit_received || 0,
        balanceDue: cr.balance_due || 0,
      };
    });
    const clientTotalEstimate = clientJobs.reduce((s, j) => s + (j.estimate || 0), 0);

    // Donations
    const donations = allDonationRecords.map(d => {
      const piano = pianos.find(p => p.id === d.piano_id);
      return {
        pianoId: d.piano_id,
        pianoName: piano ? `${piano.brand} ${piano.model || ''}`.trim() : d.piano_id,
        donationRecipient: d.donation_recipient || '—',
        donationStatus: d.donation_status || 'pending',
        donationValue: d.donation_value,
      };
    });

    // Archive
    const archivePianos = pianos.filter(p => p.ownership_category === 'restoration_archive');

    // By type
    const byType: Record<string, number> = {};
    pianos.forEach(p => { byType[p.piano_type] = (byType[p.piano_type] || 0) + 1; });

    // Expenses by category (aggregate from expenses table)
    const byCategory: Record<string, number> = {};
    allExpenses.forEach(e => {
      if (e.purchase_price) byCategory['Purchase'] = (byCategory['Purchase'] || 0) + Number(e.purchase_price);
      if (e.parts_cost) byCategory['Parts'] = (byCategory['Parts'] || 0) + Number(e.parts_cost);
      if (e.labor_cost) byCategory['Labor'] = (byCategory['Labor'] || 0) + Number(e.labor_cost);
      if (e.moving_cost) byCategory['Moving'] = (byCategory['Moving'] || 0) + Number(e.moving_cost);
      if (e.marketing_cost) byCategory['Marketing'] = (byCategory['Marketing'] || 0) + Number(e.marketing_cost);
    });
    const totalExpenses = Object.values(byCategory).reduce((s, v) => s + v, 0);

    return {
      totalInvested, totalProjectedProfit, pianoProfit,
      clientJobs, clientTotalEstimate,
      donations, archivePianos,
      byType: Object.entries(byType),
      byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
      totalExpenses,
    };
  }, [pianos, allExpenses, allClientRecords, allDonationRecords]);

  if (pianosLoading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Reports</h1>
        <p className="text-muted-foreground text-sm mb-6">Financial summaries and analytics</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Total Invested (Business)</p>
          <p className="text-3xl font-bold font-heading">${data.totalInvested.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Projected Profit</p>
          <p className={`text-3xl font-bold font-heading ${data.totalProjectedProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${data.totalProjectedProfit.toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Client Estimates</p>
          <p className="text-3xl font-bold font-heading">${data.clientTotalEstimate.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Business Inventory Profitability */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-heading font-semibold mb-4">Business Inventory Profitability</h3>
          <div className="space-y-3">
            {data.pianoProfit.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.id} · Cost: ${p.cost.toLocaleString()} · Est. Sale: ${p.estimatedSale.toLocaleString()}
                  </p>
                </div>
                <span className={`text-sm font-bold ${p.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {p.profit >= 0 ? '+' : ''}${p.profit.toLocaleString()}
                </span>
              </div>
            ))}
            {data.pianoProfit.length === 0 && <p className="text-sm text-muted-foreground">No business inventory pianos</p>}
          </div>
        </div>

        {/* Client Work */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-heading font-semibold mb-4">Client Work</h3>
          {data.clientJobs.length > 0 ? (
            <div className="space-y-3">
              {data.clientJobs.map((job) => (
                <div key={job.pianoId} className="py-2 border-b last:border-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{job.pianoName}</p>
                    <span className="text-sm font-medium">{job.estimate ? `$${job.estimate.toLocaleString()}` : '—'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Client: {job.clientName} · Deposit: ${job.depositReceived.toLocaleString()} · Due: ${job.balanceDue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active client jobs</p>
          )}
        </div>

        {/* Donation Projects */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-heading font-semibold mb-4">Donation Projects</h3>
          {data.donations.length > 0 ? (
            <div className="space-y-3">
              {data.donations.map((d) => (
                <div key={d.pianoId} className="py-2 border-b last:border-0">
                  <p className="text-sm font-medium">{d.pianoName}</p>
                  <p className="text-xs text-muted-foreground">
                    Recipient: {d.donationRecipient} · Status: {d.donationStatus.replace(/_/g, ' ')}
                    {d.donationValue ? ` · Value: $${d.donationValue.toLocaleString()}` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No donation projects</p>
          )}
        </div>

        {/* Restoration Archive */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-heading font-semibold mb-4">Restoration Archive</h3>
          {data.archivePianos.length > 0 ? (
            <div className="space-y-3">
              {data.archivePianos.map((p) => (
                <div key={p.id} className="py-2 border-b last:border-0">
                  <p className="text-sm font-medium">{p.brand} {p.model}</p>
                  <p className="text-xs text-muted-foreground">{p.inventory_id} · SN: {p.serial_number || '—'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No archived pianos</p>
          )}
        </div>

        {/* Expenses by category */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-heading font-semibold mb-4">Expenses by Category</h3>
          {data.byCategory.length > 0 ? (
            <div className="space-y-3">
              {data.byCategory.map(([cat, amount]) => {
                const pct = data.totalExpenses > 0 ? (amount / data.totalExpenses) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{cat}</span>
                      <span className="font-medium">${amount.toLocaleString()} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
          )}
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
