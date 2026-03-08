import { motion } from 'framer-motion';
import { UserPlus, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sampleTeam } from '@/data/sampleData';

const roleBadge: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  contributor: 'bg-info/10 text-info',
  viewer: 'bg-muted text-muted-foreground',
};

export default function Team() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">Team</h1>
            <p className="text-muted-foreground text-sm">{sampleTeam.length} members</p>
          </div>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1.5" /> Invite
          </Button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {sampleTeam.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 bg-card rounded-lg border"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> {member.email}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`status-badge ${roleBadge[member.role]} capitalize`}>
                <Shield className="h-3 w-3 mr-1" /> {member.role}
              </span>
              {member.assignedPianos > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{member.assignedPianos} pianos assigned</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
