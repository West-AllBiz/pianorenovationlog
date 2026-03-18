import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Piano, Wrench, Clock, Tag, DollarSign, TrendingUp,
  PackageCheck, ArrowRight, Activity, Users, Heart, Archive
} from 'lucide-react';
import { samplePianos, sampleExpenses, sampleActivity, sampleBusinessCosts, sampleClientJobs } from '@/data/sampleData';
import { STATUS_LABELS, STATUS_COLORS, OWNERSHIP_LABELS, OWNERSHIP_COLORS, COLOR_TAG_HEX } from '@/types/piano';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const stats = useMemo(() => {
    const totalPianos = samplePianos.length;
    const businessInventory = samplePianos.filter(p => p.ownershipCategory === 'business_inventory').length;
    const clientPianos = samplePianos.filter(p => p.ownershipCategory === 'client_piano').length;
    const donationProjects = samplePianos.filter(p => p.ownershipCategory === 'donation_project').length;
    const restorationArchive = samplePianos.filter(p => p.ownershipCategory === 'restoration_archive').length;

    const restorationStatuses = ['restoration_work', 'regulation', 'voicing', 'tuning', 'cabinet_work'];
    const inRestoration = samplePianos.filter(p => restorationStatuses.includes(p.status)).length;
    const awaitingParts = samplePianos.filter(p => p.status === 'awaiting_parts').length;
    const readyForSale = samplePianos.filter(p => p.status === 'ready_for_sale').length;
    const clientJobsActive = Object.keys(sampleClientJobs).length;

    const totalInvested = Object.values(sampleBusinessCosts).reduce((sum, c) => sum + c.totalInvestment, 0);
    const projectedProfit = Object.values(sampleBusinessCosts).reduce((sum, c) => sum + (c.projectedProfit || 0), 0);

    return { totalPianos, businessInventory, clientPianos, donationProjects, restorationArchive, inRestoration, awaitingParts, readyForSale, clientJobsActive, totalInvested, projectedProfit };
  }, []);

  const statCards = [
    { label: 'Total Pianos', value: stats.totalPianos, icon: Piano, color: 'text-foreground' },
    { label: 'Business Inventory', value: stats.businessInventory, icon: Tag, color: 'text-success' },
    { label: 'Client Pianos', value: stats.clientPianos, icon: Users, color: 'text-info' },
    { label: 'Donation Projects', value: stats.donationProjects, icon: Heart, color: 'text-primary' },
    { label: 'Restoration Archive', value: stats.restorationArchive, icon: Archive, color: 'text-warning' },
    { label: 'In Restoration', value: stats.inRestoration, icon: Wrench, color: 'text-warning' },
    { label: 'Awaiting Parts', value: stats.awaitingParts, icon: Clock, color: 'text-destructive' },
    { label: 'Ready for Sale', value: stats.readyForSale, icon: PackageCheck, color: 'text-success' },
    { label: 'Client Jobs Active', value: stats.clientJobsActive, icon: Users, color: 'text-info' },
    { label: 'Total Invested', value: `$${stats.totalInvested.toLocaleString()}`, icon: DollarSign, color: 'text-foreground' },
    { label: 'Projected Profit', value: `$${stats.projectedProfit.toLocaleString()}`, icon: TrendingUp, color: 'text-success' },
  ];

  const recentActivity = sampleActivity.slice(0, 6);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div {...fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Welcome back, Nick. Here's your workshop overview.</p>
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
            {samplePianos.filter(p => !['archived'].includes(p.status)).slice(0, 6).map((piano) => (
              <Link
                key={piano.id}
                to={`/piano/${piano.id}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLOR_TAG_HEX[piano.colorTag] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">{piano.inventoryId}</span>
                    <span className={`status-badge ${STATUS_COLORS[piano.status]}`}>
                      {STATUS_LABELS[piano.status]}
                    </span>
                    <span className={`status-badge ${OWNERSHIP_COLORS[piano.ownershipCategory]}`}>
                      {OWNERSHIP_LABELS[piano.ownershipCategory]}
                    </span>
                  </div>
                  <p className="font-semibold truncate">{piano.brand} {piano.model}</p>
                  <p className="text-sm text-muted-foreground">SN: {piano.serialNumber} · {piano.tag}</p>
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
