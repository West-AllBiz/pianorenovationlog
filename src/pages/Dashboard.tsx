import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Piano, Wrench, Clock, Tag, DollarSign, TrendingUp,
  PackageCheck, ArrowRight, Activity, Users, Heart, Archive, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePianos } from '@/hooks/usePianos';
import { useAuth } from '@/hooks/useAuth';
import { AddPianoDialog } from '@/components/AddPianoDialog';
import { STATUS_LABELS, STATUS_COLORS, OWNERSHIP_LABELS, OWNERSHIP_COLORS, COLOR_TAG_HEX } from '@/types/piano';
import type { ColorTag, PianoStatus, OwnershipCategory } from '@/types/piano';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { data: pianos = [], isLoading } = usePianos();
  const { profile, canEdit } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const stats = useMemo(() => {
    const totalPianos = pianos.length;
    const businessInventory = pianos.filter(p => p.ownership_category === 'business_inventory').length;
    const clientPianos = pianos.filter(p => p.ownership_category === 'client_piano').length;
    const donationProjects = pianos.filter(p => p.ownership_category === 'donation_project').length;
    const restorationArchive = pianos.filter(p => p.ownership_category === 'restoration_archive').length;
    const restorationStatuses = ['restoration_work', 'regulation', 'voicing', 'tuning', 'cabinet_work'];
    const inRestoration = pianos.filter(p => restorationStatuses.includes(p.status)).length;
    const awaitingParts = pianos.filter(p => p.status === 'awaiting_parts').length;
    const readyForSale = pianos.filter(p => p.status === 'ready_for_sale').length;
    return { totalPianos, businessInventory, clientPianos, donationProjects, restorationArchive, inRestoration, awaitingParts, readyForSale };
  }, [pianos]);

  const statCards = [
    { label: 'Total Pianos', value: stats.totalPianos, icon: Piano, color: 'text-foreground' },
    { label: 'Business Inventory', value: stats.businessInventory, icon: Tag, color: 'text-success' },
    { label: 'Client Pianos', value: stats.clientPianos, icon: Users, color: 'text-info' },
    { label: 'Donation Projects', value: stats.donationProjects, icon: Heart, color: 'text-primary' },
    { label: 'In Restoration', value: stats.inRestoration, icon: Wrench, color: 'text-warning' },
    { label: 'Awaiting Parts', value: stats.awaitingParts, icon: Clock, color: 'text-destructive' },
    { label: 'Ready for Sale', value: stats.readyForSale, icon: PackageCheck, color: 'text-success' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div {...fadeIn} transition={{ duration: 0.4 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}.</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Piano
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} {...fadeIn} transition={{ duration: 0.4, delay: i * 0.05 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold font-heading">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold">Active Projects</h2>
            <Link to="/inventory" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {pianos.filter(p => p.status !== 'archived').slice(0, 6).map((piano) => (
              <Link
                key={piano.id}
                to={`/piano/${piano.id}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                {piano.color_tag && (
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLOR_TAG_HEX[piano.color_tag as ColorTag] || '#94a3b8' }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">{piano.inventory_id}</span>
                    <span className={`status-badge ${STATUS_COLORS[piano.status as PianoStatus] || ''}`}>
                      {STATUS_LABELS[piano.status as PianoStatus] || piano.status}
                    </span>
                    <span className={`status-badge ${OWNERSHIP_COLORS[piano.ownership_category as OwnershipCategory] || ''}`}>
                      {OWNERSHIP_LABELS[piano.ownership_category as OwnershipCategory] || piano.ownership_category}
                    </span>
                  </div>
                  <p className="font-semibold truncate">{piano.brand} {piano.model}</p>
                  <p className="text-sm text-muted-foreground">SN: {piano.serial_number || '—'} · {piano.tag}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold">{piano.percent_complete || 0}%</div>
                  <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${piano.percent_complete || 0}%` }} />
                  </div>
                </div>
              </Link>
            ))}
            {pianos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">No pianos in inventory yet</p>
                {canEdit && <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add your first piano</Button>}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">Recent Activity</h2>
          </div>
          <p className="text-sm text-muted-foreground">Activity will appear here as changes are made.</p>
        </motion.div>
      </div>

      <AddPianoDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
