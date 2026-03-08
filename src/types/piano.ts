export type PianoType = 'upright' | 'grand' | 'baby_grand' | 'console' | 'spinet' | 'digital';

export type PianoStatus =
  | 'acquired'
  | 'scheduled_pickup'
  | 'in_transit'
  | 'received'
  | 'intake_inspection'
  | 'scope_defined'
  | 'awaiting_parts'
  | 'cabinet_work'
  | 'action_work'
  | 'string_tuning'
  | 'voicing_regulation'
  | 'final_detail'
  | 'quality_control'
  | 'ready_for_listing'
  | 'listed'
  | 'sold'
  | 'delivered'
  | 'archived';

export type SourceType = 'auction' | 'private_seller' | 'trade_in' | 'estate' | 'dealer' | 'donation' | 'other';

export type ExpenseCategory =
  | 'purchase' | 'moving' | 'storage' | 'parts' | 'labor'
  | 'tuning' | 'refinishing' | 'marketing' | 'delivery' | 'miscellaneous';

export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor' | 'needs_replacement';

export type UserRole = 'admin' | 'contributor' | 'viewer';

export type TaskCategory =
  | 'cabinet_work' | 'refinishing' | 'cleaning' | 'action_regulation'
  | 'voicing' | 'tuning' | 'restringing' | 'repair' | 'parts_replacement' | 'other';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface Piano {
  id: string;
  inventoryId: string;
  brand: string;
  model: string;
  serialNumber: string;
  pianoType: PianoType;
  finish: string;
  yearBuilt: number | null;
  yearEstimated: boolean;
  dimensions: string;
  conditionAtIntake: string;
  source: SourceType;
  purchaseDate: string;
  purchasePrice: number;
  pickupDate: string | null;
  pickupLocation: string;
  transportCompany: string;
  storageLocation: string;
  status: PianoStatus;
  askingPrice: number | null;
  soldPrice: number | null;
  soldDate: string | null;
  buyerName: string | null;
  buyerContact: string | null;
  tags: string[];
  privateNotes: string;
  percentComplete: number;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionReport {
  id: string;
  pianoId: string;
  initialAssessment: string;
  soundboard: ConditionRating;
  pinblock: ConditionRating;
  bridges: ConditionRating;
  action: ConditionRating;
  keysIvories: ConditionRating;
  pedalsLyre: ConditionRating;
  cabinetCase: ConditionRating;
  stringsTuningPins: ConditionRating;
  recommendedWork: string;
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
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
  notes: string;
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

export const STATUS_LABELS: Record<PianoStatus, string> = {
  acquired: 'Acquired',
  scheduled_pickup: 'Scheduled for Pickup',
  in_transit: 'In Transit',
  received: 'Received',
  intake_inspection: 'Intake Inspection',
  scope_defined: 'Scope Defined',
  awaiting_parts: 'Awaiting Parts',
  cabinet_work: 'Cabinet / Case Work',
  action_work: 'Action / Mechanism',
  string_tuning: 'String / Tuning',
  voicing_regulation: 'Voicing / Regulation',
  final_detail: 'Final Detail',
  quality_control: 'Quality Control',
  ready_for_listing: 'Ready for Listing',
  listed: 'Listed for Sale',
  sold: 'Sold',
  delivered: 'Delivered',
  archived: 'Archived',
};

export const STATUS_COLORS: Record<PianoStatus, string> = {
  acquired: 'status-acquired',
  scheduled_pickup: 'status-acquired',
  in_transit: 'status-in-transit',
  received: 'status-in-transit',
  intake_inspection: 'status-inspection',
  scope_defined: 'status-inspection',
  awaiting_parts: 'status-restoration',
  cabinet_work: 'status-restoration',
  action_work: 'status-restoration',
  string_tuning: 'status-restoration',
  voicing_regulation: 'status-restoration',
  final_detail: 'status-restoration',
  quality_control: 'status-restoration',
  ready_for_listing: 'status-ready',
  listed: 'status-listed',
  sold: 'status-sold',
  delivered: 'status-delivered',
  archived: 'status-delivered',
};

export const PIANO_TYPE_LABELS: Record<PianoType, string> = {
  upright: 'Upright',
  grand: 'Grand',
  baby_grand: 'Baby Grand',
  console: 'Console',
  spinet: 'Spinet',
  digital: 'Digital',
};
