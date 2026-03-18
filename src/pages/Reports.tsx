import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { samplePianos, sampleExpenses, sampleBusinessCosts, sampleClientJobs, sampleDonations } from '@/data/sampleData';
import { PIANO_TYPE_LABELS, OWNERSHIP_LABELS } from '@/types/piano';

export default function Reports() {
  const data = useMemo(() => {
    // Business inventory profitability
    const businessPianos = samplePianos.filter(p => p.ownershipCategory === 'business_inventory');
    const totalInvested = Object.values(sampleBusinessCosts).reduce((s, c) => s + c.totalInvestment, 0);
    const totalProjectedProfit = Object.values(sampleBusinessCosts).reduce((s, c) => s + (c.projectedProfit || 0), 0);

    const pianoProfit = businessPianos.map(p => {
      const cost = sampleBusinessCosts[p.id];
      return {
        name: `${p.brand} ${p.model}`.trim(),
        id: p.inventoryId,
        cost: cost?.totalInvestment || 0,
        estimatedSale: cost?.estimatedSalePrice || 0,
        profit: cost?.projectedProfit || 0,
      };
    }).sort((a, b) => b.profit - a.profit);

    // Client work
    const clientJobs = Object.entries(sampleClientJobs).map(([pianoId, job]) => {
      const piano = samplePianos.find(p => p.id === pianoId);
      return { ...job, pianoName: piano ? `${piano.brand} ${piano.model}`.trim() : pianoId };
    });
    const clientTotalEstimate = clientJobs.reduce((s, j) => s + (j.estimate || 0), 0);
    const clientTotalDeposits = clientJobs.reduce((s, j) => s + j.depositReceived, 0);

    // Donations
    const donations = Object.entries(sampleDonations).map(([pianoId, d]) => {
      const piano = samplePianos.find(p => p.id === pianoId);
      return { ...d, pianoName: piano ? `${piano.brand} ${piano.model}`.trim() : pianoId };
    });

    // Archive
    const archivePianos = samplePianos.filter(p => p.ownershipCategory === 'restoration_archive');

    // By type
    const byType: Record<string, number> = {};
    samplePianos.forEach(p => { byType[p.pianoType] = (byType[p.pianoType] || 0) + 1; });

    // Expenses by category
    const byCategory: Record<string, number> = {};
    sampleExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    const totalExpenses = sampleExpenses.reduce((s, e) => s + e.amount, 0);

    return { totalInvested, totalProjectedProfit, pianoProfit, clientJobs, clientTotalEstimate, clientTotalDeposits, donations, archivePianos, byType: Object.entries(byType), byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]), totalExpenses };
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
                  <p className="text-xs text-muted-foreground">{p.inventoryId} · SN: {p.serialNumber} · {p.privateNotes || '—'}</p>
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
          <div className="space-y-3">
            {data.byCategory.map(([cat, amount]) => {
              const pct = data.totalExpenses > 0 ? (amount / data.totalExpenses) * 100 : 0;
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
