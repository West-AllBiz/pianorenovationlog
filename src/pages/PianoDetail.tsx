import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  samplePianos, sampleInspections, sampleStructuralIssues, sampleTasks, sampleExpenses,
  sampleSales, sampleActivity, sampleBusinessCosts, sampleClientJobs, sampleDonations,
  sampleCharacterNotes, samplePerformanceProfiles
} from '@/data/sampleData';
import {
  STATUS_LABELS, STATUS_COLORS, PIANO_TYPE_LABELS, OWNERSHIP_LABELS,
  COLOR_TAG_HEX, CONDITION_SCORE_LABELS, TASK_CATEGORY_LABELS,
  TONAL_CHARACTER_LABELS, ACTION_FEEL_LABELS, MUSICAL_SUITABILITY_LABELS, CABINET_CHARACTER_LABELS,
  ROI_HEALTH_LABELS, ROI_HEALTH_COLORS,
  type ConditionScore, type RoiHealth
} from '@/types/piano';

// ── Helpers ──────────────────────────────────────────────

const TABS = ['Overview', 'Intake', 'Restoration', 'Expenses', 'Character Notes', 'Activity'] as const;

const TASK_STATUS_STYLES: Record<string, string> = {
  done: 'bg-success/15 text-success',
  in_progress: 'bg-warning/15 text-warning',
  todo: 'bg-muted text-muted-foreground',
  blocked: 'bg-destructive/15 text-destructive',
};

const TASK_STATUS_DISPLAY: Record<string, string> = {
  done: 'Complete',
  in_progress: 'In Progress',
  todo: 'Pending',
  blocked: 'Awaiting Parts',
};

// ── Sub-components ───────────────────────────────────────

function FrictionDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < score
                ? score >= 7 ? 'bg-destructive' : score >= 4 ? 'bg-warning' : 'bg-success'
                : 'bg-border'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-mono text-muted-foreground">{score}/10</span>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: ConditionScore }) {
  const colorClass = value >= 4 ? 'bg-success' : value === 3 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-4 text-right">{value}</span>
    </div>
  );
}

function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`status-badge ${className || 'bg-primary/10 text-primary'}`}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────

export default function PianoDetail() {
  const { id } = useParams<{ id: string }>();
  const piano = samplePianos.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Overview');

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/inventory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to inventory
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_TAG_HEX[piano.colorTag] }} />
              <span className="text-sm font-mono text-muted-foreground">{piano.inventoryId}</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">{piano.brand} {piano.model}</h1>
            <p className="text-muted-foreground font-mono text-sm">
              {piano.inventoryId} · {PIANO_TYPE_LABELS[piano.pianoType]} · #{piano.serialNumber}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`status-badge ${STATUS_COLORS[piano.status]}`}>{STATUS_LABELS[piano.status]}</span>
            <span className={`status-badge ${ROI_HEALTH_COLORS[piano.roiHealth]}`}>{ROI_HEALTH_LABELS[piano.roiHealth]} ROI</span>
            <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1.5" /> Edit</Button>
          </div>
        </div>

        {/* Friction Alert */}
        {piano.frictionScore && piano.frictionScore >= 7 && (
          <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg flex items-start gap-2">
            <span className="text-destructive text-lg">⚠</span>
            <p className="text-sm text-foreground">
              <span className="font-semibold">High friction instrument</span> · Score {piano.frictionScore}/10 · Cap investment before committing further scope.
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Restoration Progress</span>
            <span className="text-sm font-bold font-mono">{piano.percentComplete}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${piano.percentComplete}%` }} />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b mb-6 -mx-4 sm:mx-0 overflow-x-auto">
        <div className="flex min-w-max px-4 sm:px-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap touch-target ${
                activeTab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'Overview' && <OverviewTab piano={piano} performanceProfile={performanceProfile} />}
        {activeTab === 'Intake' && <IntakeTab piano={piano} inspection={inspection} structuralIssues={structuralIssues} />}
        {activeTab === 'Restoration' && <RestorationTab tasks={tasks} performanceProfile={performanceProfile} />}
        {activeTab === 'Expenses' && <ExpensesTab businessCost={businessCost} clientJob={clientJob} donation={donation} sale={sale} expenses={expenses} expenseTotal={expenseTotal} expenseByCategory={expenseByCategory} />}
        {activeTab === 'Character Notes' && <CharacterTab characterNotes={characterNotes} />}
        {activeTab === 'Activity' && <ActivityTab activity={activity} />}
      </motion.div>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────

function OverviewTab({ piano, performanceProfile }: { piano: any; performanceProfile: any }) {
  return (
    <div className="space-y-0">
      <Section title="Piano Details">
        <div className="grid sm:grid-cols-2 gap-x-6">
          {[
            ['Internal ID', piano.inventoryId], ['Tag', piano.tag], ['Color Tag', piano.colorTag?.replace(/_/g, ' ')],
            ['Brand', piano.brand], ['Serial', piano.serialNumber], ['Type', PIANO_TYPE_LABELS[piano.pianoType]],
            ['Finish', piano.finish || '—'], ['Bench', piano.benchIncluded ? 'Included' : 'Not included'],
            ['Year Built', piano.yearBuilt ? `c. ${piano.yearBuilt}${piano.yearEstimated ? ' (est.)' : ''}` : '—'],
            ['Country', piano.countryOfOrigin || '—'],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">{k as string}</span>
              <span className="text-sm font-medium capitalize">{v as string}</span>
            </div>
          ))}
        </div>
      </Section>

      {piano.frictionScore && (
        <Section title="Friction Score">
          <FrictionDots score={piano.frictionScore} />
          {piano.frictionScore >= 7 && (
            <p className="text-xs text-destructive mt-2">High friction — significant investment risk</p>
          )}
          {piano.frictionScore >= 4 && piano.frictionScore < 7 && (
            <p className="text-xs text-warning mt-2">Moderate friction — monitor costs</p>
          )}
        </Section>
      )}

      <Section title="ROI Health">
        <div className="flex items-center gap-3">
          <span className={`status-badge text-sm ${ROI_HEALTH_COLORS[piano.roiHealth]}`}>
            {ROI_HEALTH_LABELS[piano.roiHealth]}
          </span>
          {piano.roiHealth === 'watch' && (
            <span className="text-xs text-muted-foreground">Cap investment or escalate to Diamond</span>
          )}
        </div>
      </Section>

      {piano.privateNotes && (
        <Section title="Private Notes">
          <p className="text-sm text-muted-foreground">{piano.privateNotes}</p>
        </Section>
      )}

      {performanceProfile && (
        <Section title="Performance Profile">
          <div className="grid sm:grid-cols-2 gap-x-6">
            {[
              ['Pitch Level', performanceProfile.pitchLevel],
              ['Last Tuning', performanceProfile.lastTuningDate || '—'],
              ['Pitch Raise Required', performanceProfile.pitchRaiseRequired ? 'Required' : 'Not required'],
              ['Regulation Status', performanceProfile.regulationStatus],
              ['Voicing Status', performanceProfile.voicingStatus],
              ['Humidity Sensitivity', performanceProfile.humiditySensitivity],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{label as string}</span>
                <span className="text-sm font-medium">{value as string}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Intake Tab ───────────────────────────────────────────

function IntakeTab({ piano, inspection, structuralIssues }: { piano: any; inspection: any; structuralIssues: any }) {
  if (!inspection) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No inspection report yet</p>
        <Button variant="outline" size="sm" className="mt-3">Create Inspection Report</Button>
      </div>
    );
  }

  const conditionEntries: [string, ConditionScore][] = [
    ['Soundboard', inspection.soundboard], ['Bridges', inspection.bridges],
    ['Pinblock', inspection.pinblock], ['Strings', inspection.strings],
    ['Tuning Pins', inspection.tuningPins], ['Action', inspection.action],
    ['Hammers', inspection.hammers], ['Dampers', inspection.dampers],
    ['Keytops', inspection.keytops], ['Pedals', inspection.pedals],
    ['Trapwork', inspection.trapwork], ['Cabinet', inspection.cabinet],
    ['Casters', inspection.casters],
  ];

  const avgScore = conditionEntries.reduce((s, [, v]) => s + v, 0) / conditionEntries.length;

  const allIssues = [
    'Soundboard cracks', 'Bridge separation', 'Loose tuning pins', 'Rust',
    'Water damage', 'Action wear', 'Loose joints', 'Pedal problems',
  ];
  const issueKeys = [
    'soundboardCracks', 'bridgeSeparation', 'looseTuningPins', 'rust',
    'waterDamage', 'actionWear', 'looseJoints', 'pedalProblems',
  ];

  return (
    <div className="space-y-0">
      <Section title="Condition Scores (1–5)">
        <div className="space-y-2.5">
          {conditionEntries.map(([name, score]) => (
            <ScoreBar key={name} label={name} value={score} />
          ))}
        </div>
        <div className="mt-4 pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            Overall avg: <span className="font-mono font-semibold text-foreground">{avgScore.toFixed(1)}</span> / 5
          </p>
        </div>
      </Section>

      {structuralIssues && (
        <Section title="Structural Issues">
          <div className="grid sm:grid-cols-2 gap-2">
            {allIssues.map((issue, i) => {
              const present = structuralIssues[issueKeys[i] as keyof typeof structuralIssues] as boolean;
              return (
                <div key={issue} className={`flex items-center gap-2 py-2 px-3 rounded border ${present ? 'bg-destructive/5 border-destructive/20' : 'bg-card'}`}>
                  <div className={`w-2 h-2 rounded-full ${present ? 'bg-destructive' : 'bg-success'}`} />
                  <span className="text-sm">{issue}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Source & Ownership">
        <div className="flex flex-wrap gap-2">
          <Tag>{OWNERSHIP_LABELS[piano.ownershipCategory]}</Tag>
          <Tag className="bg-secondary text-secondary-foreground">Source: {piano.source.replace(/_/g, ' ')}</Tag>
        </div>
      </Section>

      {inspection.recommendedWork && (
        <Section title="Recommended Work">
          <p className="text-sm text-muted-foreground">{inspection.recommendedWork}</p>
          <div className="mt-2">
            <span className={`status-badge ${inspection.priorityLevel === 'high' || inspection.priorityLevel === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
              Priority: {inspection.priorityLevel}
            </span>
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Restoration Tab ──────────────────────────────────────

function RestorationTab({ tasks, performanceProfile }: { tasks: any[]; performanceProfile: any }) {
  return (
    <div className="space-y-0">
      <Section title="Restoration Tasks">
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((t: any) => (
              <div key={t.id} className="p-4 bg-card rounded-lg border">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-medium text-sm">{t.title}</span>
                  <span className={`status-badge text-xs flex-shrink-0 ${TASK_STATUS_STYLES[t.status] || 'bg-muted text-muted-foreground'}`}>
                    {TASK_STATUS_DISPLAY[t.status] || t.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div>Assigned: <span className="text-foreground">{t.assignee || '—'}</span></div>
                  <div>Hours: <span className="text-foreground font-mono">{t.laborHours}h</span></div>
                  <div>Parts: <span className="text-foreground">{t.partsUsed || 'None'}</span></div>
                  {t.completionDate && <div>Completed: <span className="text-foreground">{t.completionDate}</span></div>}
                </div>
                {t.notes && <p className="text-xs text-muted-foreground mt-2 italic">{t.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No renovation tasks yet</p>
            <Button variant="outline" size="sm" className="mt-3">Add Task</Button>
          </div>
        )}
      </Section>

      {performanceProfile && (
        <Section title="Performance Profile">
          <div className="grid sm:grid-cols-2 gap-x-6">
            {[
              ['Pitch Level', performanceProfile.pitchLevel],
              ['Last Tuning', performanceProfile.lastTuningDate || 'Unknown'],
              ['Pitch Raise', performanceProfile.pitchRaiseRequired ? 'Required' : 'Not required'],
              ['Regulation', performanceProfile.regulationStatus],
              ['Voicing', performanceProfile.voicingStatus],
              ['Humidity', performanceProfile.humiditySensitivity],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{k as string}</span>
                <span className="text-sm font-medium">{v as string}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Expenses Tab ─────────────────────────────────────────

function ExpensesTab({ businessCost, clientJob, donation, sale, expenses, expenseTotal, expenseByCategory }: any) {
  if (businessCost) {
    const { totalInvestment, estimatedSalePrice, projectedProfit } = businessCost;
    const margin = totalInvestment > 0 && projectedProfit ? Math.round((projectedProfit / totalInvestment) * 100) : 0;

    return (
      <div className="space-y-0">
        <Section title="Cost Breakdown">
          <div className="space-y-1.5">
            {[
              ['Purchase Price', businessCost.purchasePrice],
              ['Moving Cost', businessCost.movingCost],
              ['Parts Cost', businessCost.partsCost],
              ['Labor Cost', businessCost.laborCost],
              ['Marketing', businessCost.marketingCost],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{k as string}</span>
                <span className="text-sm font-mono">${(v as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Profit Summary">
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm font-medium">Total Invested</span>
              <span className="text-sm font-mono font-bold">${totalInvestment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm font-medium">Est. Sale Price</span>
              <span className="text-sm font-mono font-bold">${(estimatedSalePrice || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Projected Profit</span>
              <div className="text-right">
                <span className={`text-lg font-mono font-bold ${(projectedProfit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${(projectedProfit || 0).toLocaleString()}
                </span>
                {margin > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">{margin}% margin</span>
                )}
              </div>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  if (clientJob) {
    return (
      <div className="space-y-0">
        <Section title="Client Job Details">
          <div className="grid sm:grid-cols-2 gap-x-6">
            {[
              ['Client Name', clientJob.clientName],
              ['Estimate', clientJob.estimate ? `$${clientJob.estimate.toLocaleString()}` : '—'],
              ['Deposit Received', `$${clientJob.depositReceived.toLocaleString()}`],
              ['Work Authorized', clientJob.workAuthorized ? 'Yes' : 'No'],
              ['Labor Hours', `${clientJob.laborHours}h`],
              ['Invoice Total', clientJob.invoiceTotal ? `$${clientJob.invoiceTotal.toLocaleString()}` : 'Pending'],
              ['Balance Due', `$${clientJob.balanceDue.toLocaleString()}`],
              ['Pickup Date', clientJob.pickupDate || 'TBD'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{label as string}</span>
                <span className="text-sm font-medium">{value as string}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    );
  }

  if (donation) {
    return (
      <div className="space-y-0">
        <Section title="Donation Project">
          <div className="grid sm:grid-cols-2 gap-x-6">
            {[
              ['Recipient', donation.donationRecipient],
              ['Status', donation.donationStatus.replace(/_/g, ' ')],
              ['Donation Value', donation.donationValue ? `$${donation.donationValue.toLocaleString()}` : '—'],
              ['Delivery Date', donation.deliveryDate || 'TBD'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{label as string}</span>
                <span className="text-sm font-medium capitalize">{value as string}</span>
              </div>
            ))}
          </div>
          {donation.notes && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{donation.notes}</p>
            </div>
          )}
        </Section>
      </div>
    );
  }

  if (expenses.length > 0) {
    return (
      <Section title="All Expenses">
        <div className="space-y-2">
          {expenses.map((expense: any) => (
            <div key={expense.id} className="flex items-center justify-between py-2 px-3 bg-card rounded border">
              <div>
                <p className="text-sm font-medium">{expense.vendor}</p>
                <p className="text-xs text-muted-foreground">{expense.date} · {expense.category}</p>
              </div>
              <span className="font-mono text-sm">${expense.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Section>
    );
  }

  return (
    <div className="text-center py-12 text-muted-foreground">
      <p>No expenses recorded</p>
      <Button variant="outline" size="sm" className="mt-3">Add Expense</Button>
    </div>
  );
}

// ── Character Notes Tab ──────────────────────────────────

function CharacterTab({ characterNotes }: { characterNotes: any }) {
  if (!characterNotes) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No character notes yet</p>
        <Button variant="outline" size="sm" className="mt-3">Add Character Notes</Button>
      </div>
    );
  }

  const tagSections: [string, string[], string][] = [
    ['Tonal Character', (characterNotes.tonalCharacter || []).map((t: string) => TONAL_CHARACTER_LABELS[t as keyof typeof TONAL_CHARACTER_LABELS] || t), 'bg-primary/10 text-primary'],
    ['Action Feel', (characterNotes.actionFeel || []).map((a: string) => ACTION_FEEL_LABELS[a as keyof typeof ACTION_FEEL_LABELS] || a), 'bg-info/10 text-info'],
    ['Musical Suitability', (characterNotes.musicalSuitability || []).map((m: string) => MUSICAL_SUITABILITY_LABELS[m as keyof typeof MUSICAL_SUITABILITY_LABELS] || m), 'bg-success/10 text-success'],
    ['Cabinet / Visual', (characterNotes.cabinetCharacter || []).map((c: string) => CABINET_CHARACTER_LABELS[c as keyof typeof CABINET_CHARACTER_LABELS] || c), 'bg-purple-100 text-purple-700'],
  ];

  return (
    <div className="space-y-0">
      {tagSections.map(([title, values, colorClass]) => (
        values.length > 0 && (
          <Section key={title} title={title}>
            <div className="flex flex-wrap gap-2">
              {values.map((v: string) => (
                <Tag key={v} className={colorClass}>{v}</Tag>
              ))}
            </div>
          </Section>
        )
      ))}

      {characterNotes.customShopNotes && (
        <Section title="Custom Shop Notes">
          <p className="text-sm text-muted-foreground leading-relaxed">{characterNotes.customShopNotes}</p>
        </Section>
      )}
    </div>
  );
}

// ── Activity Tab ─────────────────────────────────────────

function ActivityTab({ activity }: { activity: any[] }) {
  if (activity.length === 0) {
    return <p className="text-center py-12 text-muted-foreground">No activity recorded</p>;
  }

  return (
    <Section title="Activity Log">
      <div className="space-y-3">
        {activity.map((a: any) => (
          <div key={a.id} className="flex gap-3 py-2 border-b last:border-0">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {a.userName.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono">
                {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {a.userName}
              </p>
              <p className="text-sm">{a.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
