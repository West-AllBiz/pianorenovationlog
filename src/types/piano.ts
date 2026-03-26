export type PianoType = 'upright' | 'grand' | 'baby_grand' | 'console' | 'spinet' | 'digital' | 'player_piano';

export type OwnershipCategory = 'business_inventory' | 'client_piano' | 'donation_project' | 'restoration_archive';

export type PianoStatus =
  | 'acquired'
  | 'pickup_scheduled'
  | 'transport'
  | 'intake_inspection'
  | 'evaluation'
  | 'awaiting_parts'
  | 'restoration_work'
  | 'regulation'
  | 'voicing'
  | 'tuning'
  | 'cabinet_work'
  | 'final_qc'
  | 'ready_for_sale'
  | 'client_pickup'
  | 'donation_delivery'
  | 'archived';

export type SourceType = 'auction' | 'private_seller' | 'estate' | 'trade_in' | 'client_repair' | 'donation' | 'other';

export type ExpenseCategory =
  | 'purchase' | 'moving' | 'parts' | 'labor'
  | 'tuning' | 'refinishing' | 'marketing' | 'delivery' | 'miscellaneous';

export type ConditionScore = 1 | 2 | 3 | 4 | 5;

export type RoiHealth = 'strong' | 'moderate' | 'watch' | 'mission' | 'client' | 'archive';

export type FrictionScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type UserRole = 'admin' | 'contributor' | 'viewer';

export type TaskCategory =
  | 'cleaning' | 'pitch_raise' | 'tuning' | 'regulation' | 'voicing'
  | 'hammer_shaping' | 'hammer_replacement' | 'damper_regulation' | 'action_rebuild'
  | 'key_leveling' | 'key_bushing_replacement' | 'pedal_repair' | 'string_replacement'
  | 'bridge_repair' | 'soundboard_repair' | 'cabinet_work' | 'cabinet_repair' | 'refinishing'
  | 'polishing' | 'final_detailing' | 'final_qc' | 'structural' | 'other';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export type ColorTag = 'pink' | 'magenta' | 'yellow' | 'light_green' | 'orange' | 'dark_blue' | 'light_blue' | 'purple' | 'lavender' | 'green';

export type TonalCharacter = 'bright' | 'warm' | 'mellow' | 'dark' | 'rich_bass' | 'clear_treble' | 'concert_tone' | 'studio_tone' | 'intimate_tone' | 'balanced';

export type ActionFeel = 'light_action' | 'medium_action' | 'heavy_action' | 'fast_repetition' | 'responsive' | 'needs_regulation' | 'even_touch' | 'uneven_touch';

export type MusicalSuitability = 'classical' | 'jazz' | 'studio_recording' | 'home_practice' | 'performance_stage' | 'teaching_studio' | 'church_use' | 'practice_instrument';

export type CabinetCharacter = 'high_gloss' | 'satin_finish' | 'original_cabinet' | 'refinished_cabinet' | 'art_case' | 'decorative_carving' | 'period_antique' | 'modern_cabinet';

export interface Piano {
  id: string;
  inventoryId: string;
  tag: string;
  colorTag: ColorTag;
  brand: string;
  model: string;
  serialNumber: string;
  pianoType: PianoType;
  finish: string;
  benchIncluded: boolean;
  yearBuilt: number | null;
  yearEstimated: boolean;
  countryOfOrigin: string;
  ownershipCategory: OwnershipCategory;
  source: SourceType;
  purchaseDate: string | null;
  purchasePrice: number | null;
  pickupDate: string | null;
  pickupLocation: string;
  transportCompany: string;
  status: PianoStatus;
  askingPrice: number | null;
  soldPrice: number | null;
  soldDate: string | null;
  buyerName: string | null;
  buyerContact: string | null;
  tags: string[];
  privateNotes: string;
  percentComplete: number;
  frictionScore: FrictionScore | null;
  roiHealth: RoiHealth;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionInspection {
  id: string;
  pianoId: string;
  initialAssessment: string;
  soundboard: ConditionScore;
  bridges: ConditionScore;
  pinblock: ConditionScore;
  strings: ConditionScore;
  tuningPins: ConditionScore;
  action: ConditionScore;
  hammers: ConditionScore;
  dampers: ConditionScore;
  keytops: ConditionScore;
  pedals: ConditionScore;
  trapwork: ConditionScore;
  cabinet: ConditionScore;
  casters: ConditionScore;
  recommendedWork: string;
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
}

export interface StructuralIssues {
  pianoId: string;
  soundboardCracks: boolean;
  soundboardCracksNotes: string;
  bridgeSeparation: boolean;
  bridgeSeparationNotes: string;
  looseTuningPins: boolean;
  looseTuningPinsNotes: string;
  rust: boolean;
  rustNotes: string;
  waterDamage: boolean;
  waterDamageNotes: string;
  actionWear: boolean;
  actionWearNotes: string;
  looseJoints: boolean;
  looseJointsNotes: string;
  pedalProblems: boolean;
  pedalProblemsNotes: string;
}

export interface RenovationTask {
  id: string;
  pianoId: string;
  phase: PianoStatus;
  category: TaskCategory;
  title: string;
  description: string;
  assignee: string | null;
  dueDate: string | null;
  status: TaskStatus;
  laborHours: number;
  partsUsed: string;
  notes: string;
  completionDate: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  pianoId: string;
  category: ExpenseCategory;
  date: string;
  vendor: string;
  amount: number;
  notes: string;
  receiptUrl: string | null;
}

export interface BusinessCostTracking {
  pianoId: string;
  purchasePrice: number;
  movingCost: number;
  partsCost: number;
  laborHours: number;
  laborCost: number;
  marketingCost: number;
  totalInvestment: number;
  estimatedSalePrice: number | null;
  projectedProfit: number | null;
  actualSalePrice: number | null;
}

export interface ClientJobTracking {
  pianoId: string;
  clientName: string;
  clientContact: string;
  estimate: number | null;
  depositReceived: number;
  workAuthorized: boolean;
  laborHours: number;
  partsUsed: string;
  invoiceTotal: number | null;
  balanceDue: number;
  pickupDate: string | null;
}

export interface DonationTracking {
  pianoId: string;
  donationRecipient: string;
  donationStatus: 'pending' | 'in_progress' | 'ready' | 'delivered';
  donationValue: number | null;
  deliveryDate: string | null;
  notes: string;
}

export interface CharacterNotes {
  pianoId: string;
  tonalCharacter: TonalCharacter[];
  actionFeel: ActionFeel[];
  musicalSuitability: MusicalSuitability[];
  cabinetCharacter: CabinetCharacter[];
  customShopNotes: string;
}

export interface PerformanceProfile {
  pianoId: string;
  pitchLevel: string;
  lastTuningDate: string | null;
  pitchRaiseRequired: boolean;
  regulationStatus: string;
  voicingStatus: string;
  humiditySensitivity: string;
}

export interface SaleRecord {
  id: string;
  pianoId: string;
  listingDate: string;
  listingChannels: string[];
  buyerName: string;
  buyerContact: string;
  negotiatedPrice: number;
  depositAmount: number;
  deliveryDate: string | null;
  paymentStatus: 'pending' | 'deposit_received' | 'paid_in_full';
  saleNotes: string;
}

export interface ActivityLogEntry {
  id: string;
  pianoId: string;
  userId: string;
  userName: string;
  action: string;
  detail: string;
  timestamp: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  assignedPianos: number;
}

export const OWNERSHIP_LABELS: Record<OwnershipCategory, string> = {
  business_inventory: 'Business Inventory',
  client_piano: 'Client Piano',
  donation_project: 'Donation Project',
  restoration_archive: 'Restoration Archive',
};

export const OWNERSHIP_COLORS: Record<OwnershipCategory, string> = {
  business_inventory: 'bg-emerald-50 text-emerald-700',
  client_piano: 'bg-blue-50 text-blue-700',
  donation_project: 'bg-purple-50 text-purple-700',
  restoration_archive: 'bg-amber-50 text-amber-700',
};

export const STATUS_LABELS: Record<PianoStatus, string> = {
  acquired: 'Acquired',
  pickup_scheduled: 'Pickup Scheduled',
  transport: 'Transport',
  intake_inspection: 'Intake Inspection',
  evaluation: 'Evaluation',
  awaiting_parts: 'Awaiting Parts',
  restoration_work: 'Restoration Work',
  regulation: 'Regulation',
  voicing: 'Voicing',
  tuning: 'Tuning',
  cabinet_work: 'Cabinet Work',
  final_qc: 'Final QC',
  ready_for_sale: 'Ready for Sale',
  client_pickup: 'Client Pickup',
  donation_delivery: 'Donation Delivery',
  archived: 'Archived',
};

export const STATUS_COLORS: Record<PianoStatus, string> = {
  acquired: 'status-acquired',
  pickup_scheduled: 'status-acquired',
  transport: 'status-in-transit',
  intake_inspection: 'status-inspection',
  evaluation: 'status-inspection',
  awaiting_parts: 'status-restoration',
  restoration_work: 'status-restoration',
  regulation: 'status-restoration',
  voicing: 'status-restoration',
  tuning: 'status-restoration',
  cabinet_work: 'status-restoration',
  final_qc: 'status-restoration',
  ready_for_sale: 'status-ready',
  client_pickup: 'status-listed',
  donation_delivery: 'status-listed',
  archived: 'status-delivered',
};

export const PIANO_TYPE_LABELS: Record<PianoType, string> = {
  upright: 'Upright',
  grand: 'Grand',
  baby_grand: 'Baby Grand',
  console: 'Console',
  spinet: 'Spinet',
  digital: 'Digital',
  player_piano: 'Player Piano',
};

export const COLOR_TAG_HEX: Record<ColorTag, string> = {
  pink: '#EC4899',
  magenta: '#D946EF',
  yellow: '#EAB308',
  light_green: '#84CC16',
  orange: '#F97316',
  dark_blue: '#1D4ED8',
  light_blue: '#38BDF8',
  purple: '#8B5CF6',
  lavender: '#C4B5FD',
  green: '#22C55E',
};

export const COLOR_TAG_LABELS: Record<ColorTag, string> = {
  pink: 'Pink',
  magenta: 'Magenta',
  yellow: 'Yellow',
  light_green: 'Light Green',
  orange: 'Orange',
  dark_blue: 'Dark Blue',
  light_blue: 'Light Blue',
  purple: 'Purple',
  lavender: 'Lavender',
  green: 'Green',
};

export const CONDITION_SCORE_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  cleaning: 'Cleaning',
  pitch_raise: 'Pitch Raise',
  tuning: 'Tuning',
  regulation: 'Regulation',
  voicing: 'Voicing',
  hammer_shaping: 'Hammer Shaping',
  hammer_replacement: 'Hammer Replacement',
  damper_regulation: 'Damper Regulation',
  action_rebuild: 'Action Rebuild',
  key_leveling: 'Key Leveling',
  key_bushing_replacement: 'Key Bushing Replacement',
  pedal_repair: 'Pedal Repair',
  string_replacement: 'String Replacement',
  bridge_repair: 'Bridge Repair',
  soundboard_repair: 'Soundboard Repair',
  cabinet_repair: 'Cabinet Repair',
  refinishing: 'Refinishing',
  polishing: 'Polishing',
  final_detailing: 'Final Detailing',
  other: 'Other',
};

export const TONAL_CHARACTER_LABELS: Record<TonalCharacter, string> = {
  bright: 'Bright', warm: 'Warm', mellow: 'Mellow', dark: 'Dark',
  rich_bass: 'Rich Bass', clear_treble: 'Clear Treble', concert_tone: 'Concert Tone',
  studio_tone: 'Studio Tone', intimate_tone: 'Intimate Tone', balanced: 'Balanced',
};

export const ACTION_FEEL_LABELS: Record<ActionFeel, string> = {
  light_action: 'Light Action', medium_action: 'Medium Action', heavy_action: 'Heavy Action',
  fast_repetition: 'Fast Repetition', responsive: 'Responsive', needs_regulation: 'Needs Regulation',
  even_touch: 'Even Touch', uneven_touch: 'Uneven Touch',
};

export const MUSICAL_SUITABILITY_LABELS: Record<MusicalSuitability, string> = {
  classical: 'Classical Repertoire', jazz: 'Jazz', studio_recording: 'Studio Recording',
  home_practice: 'Home Practice', performance_stage: 'Performance Stage',
  teaching_studio: 'Teaching Studio', church_use: 'Church Use', practice_instrument: 'Practice Instrument',
};

export const CABINET_CHARACTER_LABELS: Record<CabinetCharacter, string> = {
  high_gloss: 'High Gloss', satin_finish: 'Satin Finish', original_cabinet: 'Original Cabinet',
  refinished_cabinet: 'Refinished Cabinet', art_case: 'Art Case', decorative_carving: 'Decorative Carving',
  period_antique: 'Period Antique', modern_cabinet: 'Modern Cabinet',
};

export const ROI_HEALTH_LABELS: Record<RoiHealth, string> = {
  strong: 'Strong', moderate: 'Moderate', watch: 'Watch',
  mission: 'Mission', client: 'Client', archive: 'Archive',
};

export const ROI_HEALTH_COLORS: Record<RoiHealth, string> = {
  strong: 'bg-success/15 text-success',
  moderate: 'bg-warning/15 text-warning',
  watch: 'bg-destructive/15 text-destructive',
  mission: 'bg-purple-100 text-purple-700',
  client: 'bg-info/15 text-info',
  archive: 'bg-muted text-muted-foreground',
};
