import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  samplePianos, sampleInspections, sampleStructuralIssues, sampleTasks, sampleExpenses,
  sampleSales, sampleActivity, sampleBusinessCosts, sampleClientJobs, sampleDonations,
  sampleCharacterNotes, samplePerformanceProfiles
} from '@/data/sampleData';
import {
  STATUS_LABELS, STATUS_COLORS, PIANO_TYPE_LABELS, OWNERSHIP_LABELS, OWNERSHIP_COLORS,
  COLOR_TAG_HEX, CONDITION_SCORE_LABELS, TASK_CATEGORY_LABELS,
  TONAL_CHARACTER_LABELS, ACTION_FEEL_LABELS, MUSICAL_SUITABILITY_LABELS, CABINET_CHARACTER_LABELS,
  type ConditionScore, type TaskStatus
} from '@/types/piano';

const conditionColor = (score: ConditionScore): string => {
  if (score >= 4) return 'text-success';
  if (score === 3) return 'text-info';
  if (score === 2) return 'text-warning';
  return 'text-destructive';
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
  const structuralIssues = id ? sampleStructuralIssues[id] : undefined;
  const tasks = sampleTasks.filter(t => t.pianoId === id);
  const expenses = sampleExpenses.filter(e => e.pianoId === id);
  const sale = id ? sampleSales[id] : undefined;
  const activity = sampleActivity.filter(a => a.pianoId === id);
  const businessCost = id ? sampleBusinessCosts[id] : undefined;
  const clientJob = id ? sampleClientJobs[id] : undefined;
  const donation = id ? sampleDonations[id] : undefined;
  const characterNotes = id ? sampleCharacterNotes[id] : undefined;
  const performanceProfile = id ? samplePerformanceProfiles[id] : undefined;

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

  const tabList = ['overview', 'intake', 'renovation', 'expenses', 'client / donation', 'character', 'activity'];

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
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLOR_TAG_HEX[piano.colorTag] }}
              />
              <span className="text-sm font-mono text-muted-foreground">{piano.inventoryId}</span>
              <span className={`status-badge ${STATUS_COLORS[piano.status]}`}>{STATUS_LABELS[piano.status]}</span>
              <span className={`status-badge ${OWNERSHIP_COLORS[piano.ownershipCategory]}`}>{OWNERSHIP_LABELS[piano.ownershipCategory]}</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">{piano.brand} {piano.model}</h1>
            <p className="text-muted-foreground">
              {PIANO_TYPE_LABELS[piano.pianoType]} · SN: {piano.serialNumber} · {piano.tag}
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
          {tabList.map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 capitalize touch-target whitespace-nowrap"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['Serial Number', piano.serialNumber],
              ['Piano Type', PIANO_TYPE_LABELS[piano.pianoType]],
              ['Ownership', OWNERSHIP_LABELS[piano.ownershipCategory]],
              ['Source', piano.source.replace(/_/g, ' ')],
              ['Country of Origin', piano.countryOfOrigin || '—'],
              ['Bench Included', piano.benchIncluded ? 'Yes' : 'No'],
              ['Year Built', piano.yearBuilt ? `c.${piano.yearBuilt}${piano.yearEstimated ? ' (est.)' : ''}` : '—'],
              ['Finish', piano.finish || '—'],
              ['Purchase Date', piano.purchaseDate || '—'],
              ['Purchase Price', piano.purchasePrice ? `$${piano.purchasePrice.toLocaleString()}` : '—'],
              ['Asking Price', piano.askingPrice ? `$${piano.askingPrice.toLocaleString()}` : '—'],
              ['Tags', piano.tags.join(', ') || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-right capitalize">{value}</span>
              </div>
            ))}
          </div>
          {piano.privateNotes && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1">Private Notes</p>
              <p className="text-sm">{piano.privateNotes}</p>
            </div>
          )}

          {/* Performance Profile */}
          {performanceProfile && (
            <div className="mt-6 p-4 bg-card rounded-lg border">
              <h3 className="font-heading font-semibold mb-3">Performance Profile</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ['Pitch Level', performanceProfile.pitchLevel],
                  ['Last Tuning', performanceProfile.lastTuningDate || '—'],
                  ['Pitch Raise Required', performanceProfile.pitchRaiseRequired ? 'Yes' : 'No'],
                  ['Regulation Status', performanceProfile.regulationStatus],
                  ['Voicing Status', performanceProfile.voicingStatus],
                  ['Humidity Sensitivity', performanceProfile.humiditySensitivity],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* INTAKE TAB */}
        <TabsContent value="intake" className="mt-6">
          {inspection ? (
            <div className="space-y-6">
              <div className="p-4 bg-card rounded-lg border">
                <h3 className="font-heading font-semibold mb-2">Initial Assessment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{inspection.initialAssessment}</p>
              </div>
              <div>
                <h3 className="font-heading font-semibold mb-3">Condition Scores (1–5)</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    ['Soundboard', inspection.soundboard],
                    ['Bridges', inspection.bridges],
                    ['Pinblock', inspection.pinblock],
                    ['Strings', inspection.strings],
                    ['Tuning Pins', inspection.tuningPins],
                    ['Action', inspection.action],
                    ['Hammers', inspection.hammers],
                    ['Dampers', inspection.dampers],
                    ['Keytops', inspection.keytops],
                    ['Pedals', inspection.pedals],
                    ['Trapwork', inspection.trapwork],
                    ['Cabinet', inspection.cabinet],
                    ['Casters', inspection.casters],
                  ] as [string, ConditionScore][]).map(([name, score]) => (
                    <div key={name} className="flex items-center justify-between py-2 px-3 bg-card rounded border">
                      <span className="text-sm">{name}</span>
                      <span className={`text-sm font-medium ${conditionColor(score)}`}>
                        {score}/5 — {CONDITION_SCORE_LABELS[score]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Structural Issues */}
              {structuralIssues && (
                <div>
                  <h3 className="font-heading font-semibold mb-3">Structural Issues</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {([
                      ['Soundboard Cracks', structuralIssues.soundboardCracks, structuralIssues.soundboardCracksNotes],
                      ['Bridge Separation', structuralIssues.bridgeSeparation, structuralIssues.bridgeSeparationNotes],
                      ['Loose Tuning Pins', structuralIssues.looseTuningPins, structuralIssues.looseTuningPinsNotes],
                      ['Rust', structuralIssues.rust, structuralIssues.rustNotes],
                      ['Water Damage', structuralIssues.waterDamage, structuralIssues.waterDamageNotes],
                      ['Action Wear', structuralIssues.actionWear, structuralIssues.actionWearNotes],
                      ['Loose Joints', structuralIssues.looseJoints, structuralIssues.looseJointsNotes],
                      ['Pedal Problems', structuralIssues.pedalProblems, structuralIssues.pedalProblemsNotes],
                    ] as [string, boolean, string][]).map(([name, present, notes]) => (
                      <div key={name} className={`py-2 px-3 rounded border ${present ? 'bg-destructive/5 border-destructive/20' : 'bg-card'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{name}</span>
                          <span className={`text-xs font-medium ${present ? 'text-destructive' : 'text-success'}`}>
                            {present ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {notes && <p className="text-xs text-muted-foreground mt-1">{notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

        {/* RENOVATION TAB */}
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
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{TASK_CATEGORY_LABELS[task.category]}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        {task.assignee && <span>Assigned: {task.assignee}</span>}
                        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        {task.laborHours > 0 && <span>{task.laborHours}h logged</span>}
                        {task.partsUsed && <span>Parts: {task.partsUsed}</span>}
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

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="mt-6">
          {/* Business cost tracking */}
          {businessCost && (
            <div className="mb-6">
              <h3 className="font-heading font-semibold mb-3">Cost Summary</h3>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Total Investment</p>
                  <p className="text-2xl font-bold font-heading">${businessCost.totalInvestment.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Est. Sale Price</p>
                  <p className="text-2xl font-bold font-heading">${(businessCost.estimatedSalePrice || 0).toLocaleString()}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Projected Profit</p>
                  <p className={`text-2xl font-bold font-heading ${(businessCost.projectedProfit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${(businessCost.projectedProfit || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ['Purchase Price', businessCost.purchasePrice],
                  ['Moving Cost', businessCost.movingCost],
                  ['Parts Cost', businessCost.partsCost],
                  ['Labor Cost', businessCost.laborCost],
                  ['Labor Hours', businessCost.laborHours],
                  ['Marketing Cost', businessCost.marketingCost],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">{label as string}</span>
                    <span className="text-sm font-medium">
                      {typeof value === 'number' && (label as string).includes('Hours') ? `${value}h` : `$${(value as number).toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expenses.length > 0 ? (
            <div className="space-y-6">
              {!businessCost && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="stat-card">
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold font-heading">${expenseTotal.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {expenseByCategory.length > 0 && (
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
              )}

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
          ) : !businessCost ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No expenses recorded</p>
              <Button variant="outline" size="sm" className="mt-3">Add Expense</Button>
            </div>
          ) : null}
        </TabsContent>

        {/* CLIENT / DONATION TAB */}
        <TabsContent value="client / donation" className="mt-6">
          {clientJob ? (
            <div className="space-y-4">
              <h3 className="font-heading font-semibold">Client Job Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ['Client Name', clientJob.clientName],
                  ['Client Contact', clientJob.clientContact || '—'],
                  ['Estimate', clientJob.estimate ? `$${clientJob.estimate.toLocaleString()}` : '—'],
                  ['Deposit Received', `$${clientJob.depositReceived.toLocaleString()}`],
                  ['Work Authorized', clientJob.workAuthorized ? 'Yes' : 'No'],
                  ['Labor Hours', `${clientJob.laborHours}h`],
                  ['Parts Used', clientJob.partsUsed || '—'],
                  ['Invoice Total', clientJob.invoiceTotal ? `$${clientJob.invoiceTotal.toLocaleString()}` : 'Pending'],
                  ['Balance Due', `$${clientJob.balanceDue.toLocaleString()}`],
                  ['Pickup Date', clientJob.pickupDate || 'TBD'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : donation ? (
            <div className="space-y-4">
              <h3 className="font-heading font-semibold">Donation Project Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ['Recipient', donation.donationRecipient],
                  ['Status', donation.donationStatus.replace(/_/g, ' ')],
                  ['Donation Value', donation.donationValue ? `$${donation.donationValue.toLocaleString()}` : '—'],
                  ['Delivery Date', donation.deliveryDate || 'TBD'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>
              {donation.notes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                  <p className="text-sm">{donation.notes}</p>
                </div>
              )}
            </div>
          ) : sale ? (
            <div className="space-y-4">
              <h3 className="font-heading font-semibold">Sale Record</h3>
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
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No client, donation, or sale data</p>
            </div>
          )}
        </TabsContent>

        {/* CHARACTER NOTES TAB */}
        <TabsContent value="character" className="mt-6">
          {characterNotes ? (
            <div className="space-y-6">
              {characterNotes.tonalCharacter.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold mb-2">Tonal Character</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterNotes.tonalCharacter.map(t => (
                      <span key={t} className="status-badge bg-primary/10 text-primary">{TONAL_CHARACTER_LABELS[t]}</span>
                    ))}
                  </div>
                </div>
              )}
              {characterNotes.actionFeel.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold mb-2">Action Feel</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterNotes.actionFeel.map(a => (
                      <span key={a} className="status-badge bg-info/10 text-info">{ACTION_FEEL_LABELS[a]}</span>
                    ))}
                  </div>
                </div>
              )}
              {characterNotes.musicalSuitability.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold mb-2">Musical Suitability</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterNotes.musicalSuitability.map(m => (
                      <span key={m} className="status-badge bg-success/10 text-success">{MUSICAL_SUITABILITY_LABELS[m]}</span>
                    ))}
                  </div>
                </div>
              )}
              {characterNotes.cabinetCharacter.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold mb-2">Cabinet / Visual Character</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterNotes.cabinetCharacter.map(c => (
                      <span key={c} className="status-badge bg-warning/10 text-warning">{CABINET_CHARACTER_LABELS[c]}</span>
                    ))}
                  </div>
                </div>
              )}
              {characterNotes.customShopNotes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Custom Shop Notes</p>
                  <p className="text-sm">{characterNotes.customShopNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No character notes yet</p>
              <Button variant="outline" size="sm" className="mt-3">Add Character Notes</Button>
            </div>
          )}
        </TabsContent>

        {/* ACTIVITY TAB */}
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
