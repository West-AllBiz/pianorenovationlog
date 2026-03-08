import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Piano, Wrench, Clock, Tag, DollarSign, TrendingUp,
  PackageCheck, ArrowRight, Activity
} from 'lucide-react';
import { samplePianos, sampleExpenses, sampleActivity } from '@/data/sampleData';
import { STATUS_LABELS, STATUS_COLORS } from '@/types/piano';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const stats = useMemo(() => {
    const restorationStatuses = ['intake_inspection', 'scope_defined', 'awaiting_parts', 'cabinet_work', 'action_work', 'string_tuning', 'voicing_regulation', 'final_detail', 'quality_control'];
    const totalInventory = samplePianos.filter(p => p.status !== 'archived').length;
    const inRestoration = samplePianos.filter(p => restorationStatuses.includes(p.status)).length;
    const awaitingParts = samplePianos.filter(p => p.status === 'awaiting_parts').length;
    const readyForSale = samplePianos.filter(p => ['ready_for_listing', 'listed'].includes(p.status)).length;
    const soldThisMonth = samplePianos.filter(p => p.soldDate && p.soldDate.startsWith('2025-02')).length;
    const totalInvested = sampleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = samplePianos.filter(p => p.soldPrice).reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const projectedProfit = totalRevenue - totalInvested;

    return { totalInventory, inRestoration, awaitingParts, readyForSale, soldThisMonth, totalInvested, totalRevenue, projectedProfit };
  }, []);

  const statCards = [
    { label: 'Total Inventory', value: stats.totalInventory, icon: Piano, color: 'text-foreground' },
    { label: 'In Restoration', value: stats.inRestoration, icon: Wrench, color: 'text-warning' },
    { label: 'Awaiting Parts', value: stats.awaitingParts, icon: Clock, color: 'text-destructive' },
    { label: 'Ready for Sale', value: stats.readyForSale, icon: Tag, color: 'text-success' },
    { label: 'Sold This Month', value: stats.soldThisMonth, icon: PackageCheck, color: 'text-info' },
    { label: 'Total Invested', value: `$${stats.totalInvested.toLocaleString()}`, icon: DollarSign, color: 'text-foreground' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-success' },
  ];

  const recentActivity = sampleActivity.slice(0, 6);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div {...fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Welcome back, James. Here's your workshop overview.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeIn}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold font-heading">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent pianos */}
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold">Active Projects</h2>
            <Link to="/inventory" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {samplePianos.filter(p => !['sold', 'delivered', 'archived'].includes(p.status)).slice(0, 5).map((piano) => (
              <Link
                key={piano.id}
                to={`/piano/${piano.id}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">{piano.inventoryId}</span>
                    <span className={`status-badge ${STATUS_COLORS[piano.status]}`}>
                      {STATUS_LABELS[piano.status]}
                    </span>
                  </div>
                  <p className="font-semibold truncate">{piano.brand} {piano.model}</p>
                  <p className="text-sm text-muted-foreground">{piano.storageLocation}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold">{piano.percentComplete}%</div>
                  <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${piano.percentComplete}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Activity feed */}
        <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {entry.userName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <p className="text-foreground">
                    <span className="font-medium">{entry.userName}</span>
                    {' '}<span className="text-muted-foreground">{entry.action.toLowerCase()}</span>
                  </p>
                  <p className="text-muted-foreground truncate">{entry.detail}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
