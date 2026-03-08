import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, MoreHorizontal, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { samplePianos, sampleInspections, sampleTasks, sampleExpenses, sampleSales, sampleActivity } from '@/data/sampleData';
import { STATUS_LABELS, STATUS_COLORS, PIANO_TYPE_LABELS, type ConditionRating, type TaskStatus } from '@/types/piano';

const conditionColor: Record<ConditionRating, string> = {
  excellent: 'text-success',
  good: 'text-info',
  fair: 'text-warning',
  poor: 'text-destructive',
  needs_replacement: 'text-destructive',
};

const taskStatusIcon: Record<TaskStatus, typeof CheckCircle2> = {
  done: CheckCircle2,
  in_progress: Clock,
  blocked: AlertCircle,
  todo: Circle,
};

export default function PianoDetail() {
  const { id } = useParams<{ id: string }>();
  const piano = samplePianos.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState('overview');

  const inspection = id ? sampleInspections[id] : undefined;
  const tasks = sampleTasks.filter(t => t.pianoId === id);
  const expenses = sampleExpenses.filter(e => e.pianoId === id);
  const sale = id ? sampleSales[id] : undefined;
  const activity = sampleActivity.filter(a => a.pianoId === id);

  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  if (!piano) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Piano not found</p>
        <Link to="/inventory" className="text-primary hover:underline text-sm mt-2 inline-block">Back to inventory</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/inventory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to inventory
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">{piano.inventoryId}</span>
              <span className={`status-badge ${STATUS_COLORS[piano.status]}`}>{STATUS_LABELS[piano.status]}</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">{piano.brand} {piano.model}</h1>
            <p className="text-muted-foreground">
              {PIANO_TYPE_LABELS[piano.pianoType]} · {piano.finish} · {piano.yearBuilt ? `c.${piano.yearBuilt}${piano.yearEstimated ? ' (est.)' : ''}` : 'Year unknown'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1.5" /> Edit</Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Restoration Progress</span>
            <span className="text-sm font-bold">{piano.percentComplete}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${piano.percentComplete}%` }} />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto border-b bg-transparent p-0 h-auto flex-nowrap">
          {['overview', 'intake', 'renovation', 'expenses', 'media', 'sales', 'activity'].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 capitalize touch-target"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['Serial Number', piano.serialNumber],
              ['Source', piano.source.replace('_', ' ')],
              ['Purchase Date', piano.purchaseDate],
              ['Purchase Price', `$${piano.purchasePrice.toLocaleString()}`],
              ['Pickup Location', piano.pickupLocation],
              ['Transport', piano.transportCompany],
              ['Storage Location', piano.storageLocation],
              ['Dimensions', piano.dimensions],
              ['Asking Price', piano.askingPrice ? `$${piano.askingPrice.toLocaleString()}` : '—'],
              ['Tags', piano.tags.join(', ') || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
          {piano.privateNotes && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1">Private Notes</p>
              <p className="text-sm">{piano.privateNotes}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="intake" className="mt-6">
          {inspection ? (
            <div className="space-y-6">
              <div className="p-4 bg-card rounded-lg border">
                <h3 className="font-heading font-semibold mb-2">Initial Assessment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{inspection.initialAssessment}</p>
              </div>
              <div>
                <h3 className="font-heading font-semibold mb-3">Component Conditions</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    ['Soundboard', inspection.soundboard],
                    ['Pinblock', inspection.pinblock],
                    ['Bridges', inspection.bridges],
                    ['Action', inspection.action],
                    ['Keys / Ivories', inspection.keysIvories],
                    ['Pedals / Lyre', inspection.pedalsLyre],
                    ['Cabinet / Case', inspection.cabinetCase],
                    ['Strings / Tuning Pins', inspection.stringsTuningPins],
                  ] as [string, ConditionRating][]).map(([name, rating]) => (
                    <div key={name} className="flex items-center justify-between py-2 px-3 bg-card rounded border">
                      <span className="text-sm">{name}</span>
                      <span className={`text-sm font-medium capitalize ${conditionColor[rating]}`}>
                        {rating.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <h3 className="font-heading font-semibold mb-2">Recommended Work</h3>
                <p className="text-sm text-muted-foreground">{inspection.recommendedWork}</p>
                <div className="mt-3">
                  <span className={`status-badge ${inspection.priorityLevel === 'high' || inspection.priorityLevel === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    Priority: {inspection.priorityLevel}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No inspection report yet</p>
              <Button variant="outline" size="sm" className="mt-3">Create Inspection Report</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="renovation" className="mt-6">
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map(task => {
                const Icon = taskStatusIcon[task.status];
                return (
                  <div key={task.id} className="flex items-start gap-3 p-4 bg-card rounded-lg border">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${task.status === 'done' ? 'text-success' : task.status === 'blocked' ? 'text-destructive' : task.status === 'in_progress' ? 'text-warning' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{task.title}</span>
                        <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">{task.category.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {task.assignee && <span>Assigned: {task.assignee}</span>}
                        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        {task.laborHours > 0 && <span>{task.laborHours}h logged</span>}
                      </div>
                      {task.notes && <p className="text-xs text-muted-foreground mt-1 italic">{task.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No renovation tasks yet</p>
              <Button variant="outline" size="sm" className="mt-3">Add Task</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          {expenses.length > 0 ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold font-heading">${expenseTotal.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">{piano.soldPrice ? 'Sold Price' : 'Asking Price'}</p>
                  <p className="text-2xl font-bold font-heading">${(piano.soldPrice || piano.askingPrice || 0).toLocaleString()}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">{piano.soldPrice ? 'Actual Profit' : 'Est. Profit'}</p>
                  <p className={`text-2xl font-bold font-heading ${((piano.soldPrice || piano.askingPrice || 0) - expenseTotal) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${((piano.soldPrice || piano.askingPrice || 0) - expenseTotal).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold mb-3">By Category</h3>
                <div className="space-y-2">
                  {expenseByCategory.map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm capitalize">{cat}</span>
                      <span className="text-sm font-medium">${amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold mb-3">All Expenses</h3>
                <div className="space-y-2">
                  {expenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between py-2 px-3 bg-card rounded border">
                      <div>
                        <p className="text-sm font-medium">{expense.vendor}</p>
                        <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {expense.category}</p>
                      </div>
                      <span className="font-medium text-sm">${expense.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No expenses recorded</p>
              <Button variant="outline" size="sm" className="mt-3">Add Expense</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-1">Media Gallery</p>
            <p className="text-sm mb-4">Upload photos and documents for this piano</p>
            <Button variant="outline" size="sm">Upload Files</Button>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          {sale ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ['Listing Date', sale.listingDate],
                  ['Channels', sale.listingChannels.join(', ')],
                  ['Buyer', sale.buyerName],
                  ['Contact', sale.buyerContact],
                  ['Negotiated Price', `$${sale.negotiatedPrice.toLocaleString()}`],
                  ['Deposit', `$${sale.depositAmount.toLocaleString()}`],
                  ['Delivery Date', sale.deliveryDate || '—'],
                  ['Payment Status', sale.paymentStatus.replace(/_/g, ' ')],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>
              {sale.saleNotes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Sale Notes</p>
                  <p className="text-sm">{sale.saleNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No sale record yet</p>
              <Button variant="outline" size="sm" className="mt-3">Record Sale</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map(entry => (
                <div key={entry.id} className="flex gap-3 py-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {entry.userName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm"><span className="font-medium">{entry.userName}</span> {entry.action.toLowerCase()}</p>
                    <p className="text-sm text-muted-foreground">{entry.detail}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-12 text-muted-foreground">No activity recorded</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
