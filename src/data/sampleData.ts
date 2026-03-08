import {
  Piano, InspectionReport, RenovationTask, Expense, SaleRecord,
  ActivityLogEntry, TeamMember
} from '@/types/piano';

export const sampleTeam: TeamMember[] = [
  { id: 'u1', name: 'James Harrington', email: 'james@keystonepianos.com', role: 'admin', avatar: null, assignedPianos: 8 },
  { id: 'u2', name: 'Maria Chen', email: 'maria@keystonepianos.com', role: 'contributor', avatar: null, assignedPianos: 5 },
  { id: 'u3', name: 'David Park', email: 'david@keystonepianos.com', role: 'contributor', avatar: null, assignedPianos: 3 },
  { id: 'u4', name: 'Sarah Mitchell', email: 'sarah@keystonepianos.com', role: 'viewer', avatar: null, assignedPianos: 0 },
];

export const samplePianos: Piano[] = [
  {
    id: 'p1', inventoryId: 'KP-2024-001', brand: 'Steinway & Sons', model: 'Model B',
    serialNumber: '587432', pianoType: 'grand', finish: 'Satin Ebony', yearBuilt: 1978,
    yearEstimated: false, dimensions: '6\'10" x 57"', conditionAtIntake: 'Fair - needs full restoration',
    source: 'estate', purchaseDate: '2024-09-15', purchasePrice: 18500,
    pickupDate: '2024-09-20', pickupLocation: 'Greenwich, CT',
    transportCompany: 'Northeast Piano Movers', storageLocation: 'Workshop Bay 1',
    status: 'action_work', askingPrice: 62000, soldPrice: null, soldDate: null,
    buyerName: null, buyerContact: null, tags: ['flagship', 'high-value', 'steinway'],
    privateNotes: 'Excellent candidate for full rebuild. Original ivories intact.',
    percentComplete: 55, createdAt: '2024-09-15', updatedAt: '2025-03-01',
  },
  {
    id: 'p2', inventoryId: 'KP-2024-002', brand: 'Yamaha', model: 'C3',
    serialNumber: '6124890', pianoType: 'grand', finish: 'Polished Ebony', yearBuilt: 2005,
    yearEstimated: false, dimensions: '6\'1" x 58"', conditionAtIntake: 'Good - minor regulation needed',
    source: 'dealer', purchaseDate: '2024-10-02', purchasePrice: 12000,
    pickupDate: '2024-10-05', pickupLocation: 'Boston, MA',
    transportCompany: 'A-1 Piano Moving', storageLocation: 'Workshop Bay 3',
    status: 'listed', askingPrice: 24500, soldPrice: null, soldDate: null,
    buyerName: null, buyerContact: null, tags: ['yamaha', 'quick-turn'],
    privateNotes: 'Low mileage, university surplus.',
    percentComplete: 95, createdAt: '2024-10-02', updatedAt: '2025-02-20',
  },
  {
    id: 'p3', inventoryId: 'KP-2024-003', brand: 'Baldwin', model: 'Acrosonic',
    serialNumber: '842156', pianoType: 'spinet', finish: 'Walnut', yearBuilt: 1965,
    yearEstimated: true, dimensions: '36" x 57"', conditionAtIntake: 'Poor - significant work needed',
    source: 'auction', purchaseDate: '2024-11-10', purchasePrice: 400,
    pickupDate: '2024-11-12', pickupLocation: 'Hartford, CT',
    transportCompany: 'Self', storageLocation: 'Storage Unit B',
    status: 'awaiting_parts', askingPrice: 2800, soldPrice: null, soldDate: null,
    buyerName: null, buyerContact: null, tags: ['budget', 'starter-piano'],
    privateNotes: 'Needs new hammer set. Good practice piano when done.',
    percentComplete: 25, createdAt: '2024-11-10', updatedAt: '2025-02-28',
  },
  {
    id: 'p4', inventoryId: 'KP-2024-004', brand: 'Bösendorfer', model: '185',
    serialNumber: '41287', pianoType: 'grand', finish: 'Polished Ebony', yearBuilt: 1992,
    yearEstimated: false, dimensions: '6\'1" x 58"', conditionAtIntake: 'Good - cosmetic refresh needed',
    source: 'private_seller', purchaseDate: '2024-12-01', purchasePrice: 28000,
    pickupDate: '2024-12-05', pickupLocation: 'New York, NY',
    transportCompany: 'Northeast Piano Movers', storageLocation: 'Workshop Bay 2',
    status: 'voicing_regulation', askingPrice: 55000, soldPrice: null, soldDate: null,
    buyerName: null, buyerContact: null, tags: ['bosendorfer', 'premium', 'high-value'],
    privateNotes: 'Beautiful instrument. Previous owner was a concert pianist.',
    percentComplete: 75, createdAt: '2024-12-01', updatedAt: '2025-03-05',
  },
  {
    id: 'p5', inventoryId: 'KP-2025-005', brand: 'Kawai', model: 'K-500',
    serialNumber: '2847561', pianoType: 'upright', finish: 'Satin Ebony', yearBuilt: 2018,
    yearEstimated: false, dimensions: '51" x 59"', conditionAtIntake: 'Excellent - minor tuning',
    source: 'trade_in', purchaseDate: '2025-01-15', purchasePrice: 6500,
    pickupDate: '2025-01-16', pickupLocation: 'Stamford, CT',
    transportCompany: 'A-1 Piano Moving', storageLocation: 'Showroom',
    status: 'ready_for_listing', askingPrice: 12500, soldPrice: null, soldDate: null,
    buyerName: null, buyerContact: null, tags: ['kawai', 'quick-turn', 'upright'],
    privateNotes: 'Essentially new. Trade-in from customer upgrading to grand.',
    percentComplete: 100, createdAt: '2025-01-15', updatedAt: '2025-02-10',
  },
  {
    id: 'p6', inventoryId: 'KP-2024-006', brand: 'Mason & Hamlin', model: 'Model A',
    serialNumber: '89421', pianoType: 'grand', finish: 'Satin Mahogany', yearBuilt: 1927,
    yearEstimated: true, dimensions: '5\'8" x 57"', conditionAtIntake: 'Fair - complete rebuild',
    source: 'estate', purchaseDate: '2024-08-20', purchasePrice: 3200,
    pickupDate: '2024-08-25', pickupLocation: 'Providence, RI',
    transportCompany: 'Northeast Piano Movers', storageLocation: 'Workshop Bay 4',
    status: 'sold', askingPrice: 32000, soldPrice: 29500, soldDate: '2025-02-15',
    buyerName: 'Eleanor Whitfield', buyerContact: 'eleanor.w@email.com',
    tags: ['mason-hamlin', 'vintage', 'rebuilt'],
    privateNotes: 'Complete rebuild finished Jan 2025. Stunning result.',
    percentComplete: 100, createdAt: '2024-08-20', updatedAt: '2025-02-15',
  },
  {
    id: 'p7', inventoryId: 'KP-2025-007', brand: 'Chickering', model: 'Concert Grand',
    serialNumber: '126847', pianoType: 'grand', finish: 'Rosewood', yearBuilt: 1895,
    yearEstimated: true, dimensions: '9\'0" x 60"', conditionAtIntake: 'Poor - museum piece restoration',
    source: 'auction', purchaseDate: '2025-02-01', purchasePrice: 5500,
    pickupDate: null, pickupLocation: 'Philadelphia, PA',
    transportCompany: 'TBD', storageLocation: 'Not yet received',
    status: 'scheduled_pickup', askingPrice: null, soldPrice: null, soldDate: null,
    buyerName: null, buyerContact: null, tags: ['antique', 'chickering', 'project'],
    privateNotes: 'Massive restoration project. Needs full frame, soundboard, action rebuild.',
    percentComplete: 0, createdAt: '2025-02-01', updatedAt: '2025-03-01',
  },
  {
    id: 'p8', inventoryId: 'KP-2025-008', brand: 'Yamaha', model: 'U1',
    serialNumber: '5421876', pianoType: 'upright', finish: 'Polished Ebony', yearBuilt: 2010,
    yearEstimated: false, dimensions: '48" x 60"', conditionAtIntake: 'Good',
    source: 'private_seller', purchaseDate: '2025-02-20', purchasePrice: 3800,
    pickupDate: '2025-02-22', pickupLocation: 'New Haven, CT',
    transportCompany: 'Self', storageLocation: 'Workshop Bay 3',
    status: 'intake_inspection', askingPrice: 7500, soldPrice: null, soldDate: null,
    buyerName: null, buyerContact: null, tags: ['yamaha', 'upright', 'popular-model'],
    privateNotes: 'Very popular model. Should sell quickly once cleaned up.',
    percentComplete: 10, createdAt: '2025-02-20', updatedAt: '2025-03-07',
  },
];

export const sampleInspections: Record<string, InspectionReport> = {
  p1: {
    id: 'insp1', pianoId: 'p1', initialAssessment: 'Structurally sound Steinway Model B from 1978. Needs complete action rebuild, new hammers, dampers, and strings. Soundboard has minor cracks but is restorable. Cabinet in decent shape with typical wear.',
    soundboard: 'fair', pinblock: 'good', bridges: 'fair', action: 'poor',
    keysIvories: 'fair', pedalsLyre: 'good', cabinetCase: 'fair', stringsTuningPins: 'poor',
    recommendedWork: 'Full action rebuild, restringing, soundboard repair, cabinet refinish, new keytops',
    priorityLevel: 'high',
  },
  p2: {
    id: 'insp2', pianoId: 'p2', initialAssessment: 'Well-maintained Yamaha C3. University surplus with moderate use. Action regulation and voicing needed. Cabinet is in good condition with minor surface marks.',
    soundboard: 'excellent', pinblock: 'excellent', bridges: 'excellent', action: 'good',
    keysIvories: 'good', pedalsLyre: 'excellent', cabinetCase: 'good', stringsTuningPins: 'excellent',
    recommendedWork: 'Action regulation, voicing, cabinet polish, full tuning',
    priorityLevel: 'medium',
  },
};

export const sampleTasks: RenovationTask[] = [
  { id: 't1', pianoId: 'p1', phase: 'cabinet_work', category: 'refinishing', title: 'Strip and refinish lid', description: 'Remove old finish, sand, apply satin ebony lacquer', assignee: 'Maria Chen', dueDate: '2025-03-15', status: 'done', laborHours: 12, notes: 'Using premium lacquer from Mohawk', createdAt: '2025-01-10' },
  { id: 't2', pianoId: 'p1', phase: 'cabinet_work', category: 'cabinet_work', title: 'Repair leg chips', description: 'Fill and refinish chipped areas on all three legs', assignee: 'Maria Chen', dueDate: '2025-03-10', status: 'done', laborHours: 4, notes: '', createdAt: '2025-01-10' },
  { id: 't3', pianoId: 'p1', phase: 'action_work', category: 'action_regulation', title: 'Replace hammer set', description: 'Install new Renner hammers, voice to spec', assignee: 'David Park', dueDate: '2025-03-25', status: 'in_progress', laborHours: 8, notes: 'Renner blue hammers ordered', createdAt: '2025-02-01' },
  { id: 't4', pianoId: 'p1', phase: 'action_work', category: 'repair', title: 'Replace damper felts', description: 'Full set of new damper felts', assignee: 'David Park', dueDate: '2025-03-28', status: 'todo', laborHours: 0, notes: '', createdAt: '2025-02-01' },
  { id: 't5', pianoId: 'p1', phase: 'string_tuning', category: 'restringing', title: 'Complete restringing', description: 'Replace all bass and treble strings', assignee: 'David Park', dueDate: '2025-04-10', status: 'todo', laborHours: 0, notes: 'Mapes strings ordered', createdAt: '2025-02-15' },
  { id: 't6', pianoId: 'p4', phase: 'voicing_regulation', category: 'voicing', title: 'Concert voicing', description: 'Full voicing for concert-quality tone', assignee: 'James Harrington', dueDate: '2025-03-20', status: 'in_progress', laborHours: 6, notes: 'Owner prefers warm, rich tone', createdAt: '2025-02-20' },
  { id: 't7', pianoId: 'p3', phase: 'awaiting_parts', category: 'parts_replacement', title: 'Order hammer set', description: 'Order replacement hammers for spinet action', assignee: 'Maria Chen', dueDate: '2025-03-12', status: 'blocked', laborHours: 0, notes: 'Supplier backordered - ETA 2 weeks', createdAt: '2025-02-10' },
];

export const sampleExpenses: Expense[] = [
  { id: 'e1', pianoId: 'p1', category: 'purchase', date: '2024-09-15', vendor: 'Greenwich Estate Sales', amount: 18500, notes: 'Estate purchase', receiptUrl: null },
  { id: 'e2', pianoId: 'p1', category: 'moving', date: '2024-09-20', vendor: 'Northeast Piano Movers', amount: 850, notes: 'Pickup from Greenwich', receiptUrl: null },
  { id: 'e3', pianoId: 'p1', category: 'parts', date: '2025-02-01', vendor: 'Renner USA', amount: 1200, notes: 'New hammer set - Renner Blue', receiptUrl: null },
  { id: 'e4', pianoId: 'p1', category: 'parts', date: '2025-02-15', vendor: 'Mapes Piano Strings', amount: 680, notes: 'Complete string set', receiptUrl: null },
  { id: 'e5', pianoId: 'p1', category: 'refinishing', date: '2025-01-20', vendor: 'Mohawk Finishing', amount: 340, notes: 'Satin ebony lacquer supplies', receiptUrl: null },
  { id: 'e6', pianoId: 'p1', category: 'labor', date: '2025-03-01', vendor: 'Internal', amount: 2400, notes: 'Cabinet refinishing labor - 24hrs @ $100/hr', receiptUrl: null },
  { id: 'e7', pianoId: 'p2', category: 'purchase', date: '2024-10-02', vendor: 'Boston Piano Exchange', amount: 12000, notes: 'Dealer purchase', receiptUrl: null },
  { id: 'e8', pianoId: 'p2', category: 'moving', date: '2024-10-05', vendor: 'A-1 Piano Moving', amount: 650, notes: 'Pickup from Boston', receiptUrl: null },
  { id: 'e9', pianoId: 'p2', category: 'labor', date: '2025-01-15', vendor: 'Internal', amount: 800, notes: 'Regulation and voicing - 8hrs', receiptUrl: null },
  { id: 'e10', pianoId: 'p6', category: 'purchase', date: '2024-08-20', vendor: 'Providence Estate Auction', amount: 3200, notes: 'Auction purchase', receiptUrl: null },
  { id: 'e11', pianoId: 'p6', category: 'moving', date: '2024-08-25', vendor: 'Northeast Piano Movers', amount: 750, notes: '', receiptUrl: null },
  { id: 'e12', pianoId: 'p6', category: 'parts', date: '2024-10-15', vendor: 'Various', amount: 4200, notes: 'Full rebuild parts package', receiptUrl: null },
  { id: 'e13', pianoId: 'p6', category: 'labor', date: '2025-01-30', vendor: 'Internal', amount: 8500, notes: 'Complete rebuild labor - 85hrs', receiptUrl: null },
  { id: 'e14', pianoId: 'p4', category: 'purchase', date: '2024-12-01', vendor: 'Private Seller - NYC', amount: 28000, notes: '', receiptUrl: null },
  { id: 'e15', pianoId: 'p4', category: 'moving', date: '2024-12-05', vendor: 'Northeast Piano Movers', amount: 1100, notes: 'NYC pickup - stairs involved', receiptUrl: null },
];

export const sampleSales: Record<string, SaleRecord> = {
  p6: {
    id: 's1', pianoId: 'p6', listingDate: '2025-01-20',
    listingChannels: ['Website', 'Facebook Marketplace', 'Piano World Forum'],
    buyerName: 'Eleanor Whitfield', buyerContact: 'eleanor.w@email.com',
    negotiatedPrice: 29500, depositAmount: 5000, deliveryDate: '2025-02-20',
    paymentStatus: 'paid_in_full', saleNotes: 'Buyer is a retired music teacher. Delivery to her home in Westport.',
  },
};

export const sampleActivity: ActivityLogEntry[] = [
  { id: 'a1', pianoId: 'p1', userId: 'u2', userName: 'Maria Chen', action: 'Task completed', detail: 'Finished lid refinishing', timestamp: '2025-03-01T14:30:00Z' },
  { id: 'a2', pianoId: 'p1', userId: 'u3', userName: 'David Park', action: 'Task started', detail: 'Began hammer replacement', timestamp: '2025-03-02T09:15:00Z' },
  { id: 'a3', pianoId: 'p1', userId: 'u1', userName: 'James Harrington', action: 'Expense added', detail: 'Added $680 for strings from Mapes', timestamp: '2025-02-15T11:00:00Z' },
  { id: 'a4', pianoId: 'p4', userId: 'u1', userName: 'James Harrington', action: 'Status updated', detail: 'Moved to Voicing / Regulation', timestamp: '2025-03-05T16:45:00Z' },
  { id: 'a5', pianoId: 'p6', userId: 'u1', userName: 'James Harrington', action: 'Piano sold', detail: 'Sold to Eleanor Whitfield for $29,500', timestamp: '2025-02-15T10:00:00Z' },
  { id: 'a6', pianoId: 'p2', userId: 'u2', userName: 'Maria Chen', action: 'Status updated', detail: 'Moved to Listed for Sale', timestamp: '2025-02-20T13:20:00Z' },
  { id: 'a7', pianoId: 'p8', userId: 'u1', userName: 'James Harrington', action: 'Piano added', detail: 'Added Yamaha U1 to inventory', timestamp: '2025-02-20T08:00:00Z' },
  { id: 'a8', pianoId: 'p3', userId: 'u2', userName: 'Maria Chen', action: 'Task blocked', detail: 'Hammer set backordered', timestamp: '2025-02-28T10:30:00Z' },
];
