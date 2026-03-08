import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-6">Settings</h1>
      </motion.div>

      <div className="space-y-8">
        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Workshop Profile</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workshop Name</Label>
              <Input defaultValue="Keystone Pianos" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input defaultValue="info@keystonepianos.com" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue="(203) 555-0147" className="h-11" />
            </div>
            <Button size="sm">Save Changes</Button>
          </div>
        </section>

        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Renovation Stages</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Customize the stages pianos move through during restoration. Default stages are pre-configured.
          </p>
          <Button variant="outline" size="sm">Customize Stages</Button>
        </section>

        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Data Export</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Export your full inventory, expenses, and sales data to CSV.
          </p>
          <Button variant="outline" size="sm">Export All Data</Button>
        </section>
      </div>
    </div>
  );
}
