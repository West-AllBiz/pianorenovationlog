import {
  Piano, ConditionInspection, StructuralIssues, RenovationTask, Expense, SaleRecord,
  ActivityLogEntry, TeamMember, BusinessCostTracking, ClientJobTracking, DonationTracking,
  CharacterNotes, PerformanceProfile
} from '@/types/piano';

export const sampleTeam: TeamMember[] = [
  { id: 'u1', name: 'Nick West', email: 'nick@pianorenolog.com', role: 'admin', avatar: null, assignedPianos: 10 },
  { id: 'u2', name: 'Maria Chen', email: 'maria@pianorenolog.com', role: 'contributor', avatar: null, assignedPianos: 5 },
  { id: 'u3', name: 'David Park', email: 'david@pianorenolog.com', role: 'contributor', avatar: null, assignedPianos: 3 },
  { id: 'u4', name: 'Sarah Mitchell', email: 'sarah@pianorenolog.com', role: 'viewer', avatar: null, assignedPianos: 0 },
];

export const samplePianos: Piano[] = [
  {
    id: 'p1', inventoryId: 'P-001', tag: 'Tag 1', colorTag: 'pink',
    brand: 'Collard & Collard', model: '', serialNumber: '3929', pianoType: 'upright',
    finish: '', benchIncluded: false, yearBuilt: null, yearEstimated: true,
    countryOfOrigin: 'England', ownershipCategory: 'restoration_archive', source: 'other',
    purchaseDate: null, purchasePrice: null, pickupDate: null, pickupLocation: '',
    transportCompany: '', status: 'restoration_work', askingPrice: null, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['antique', 'long-term'], privateNotes: 'Antique long-term restoration',
    percentComplete: 15, frictionScore: 8, roiHealth: 'archive', createdAt: '2024-06-01', updatedAt: '2026-03-10',
  },
  {
    id: 'p2', inventoryId: 'P-002', tag: 'Tag 2', colorTag: 'magenta',
    brand: 'Baldwin', model: '', serialNumber: '1162505', pianoType: 'upright',
    finish: '', benchIncluded: false, yearBuilt: null, yearEstimated: false,
    countryOfOrigin: 'USA', ownershipCategory: 'business_inventory', source: 'auction',
    purchaseDate: '2026-02-15', purchasePrice: 500, pickupDate: null, pickupLocation: '',
    transportCompany: '', status: 'acquired', askingPrice: null, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['upcoming'], privateNotes: 'Upcoming',
    percentComplete: 0, frictionScore: 3, roiHealth: 'moderate', createdAt: '2026-02-15', updatedAt: '2026-03-10',
  },
  {
    id: 'p3', inventoryId: 'P-003', tag: 'Tag 3', colorTag: 'yellow',
    brand: 'Kirchner', model: '', serialNumber: '22930', pianoType: 'baby_grand',
    finish: '', benchIncluded: true, yearBuilt: null, yearEstimated: false,
    countryOfOrigin: 'Germany', ownershipCategory: 'business_inventory', source: 'estate',
    purchaseDate: '2025-11-10', purchasePrice: 1200, pickupDate: '2025-11-15', pickupLocation: '',
    transportCompany: '', status: 'evaluation', askingPrice: 4500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: [], privateNotes: '',
    percentComplete: 10, createdAt: '2025-11-10', updatedAt: '2026-03-10',
  },
  {
    id: 'p4', inventoryId: 'P-004', tag: 'Tag 4', colorTag: 'light_green',
    brand: 'Kimball', model: '', serialNumber: 'N/A', pianoType: 'upright',
    finish: '', benchIncluded: false, yearBuilt: null, yearEstimated: false,
    countryOfOrigin: 'USA', ownershipCategory: 'business_inventory', source: 'private_seller',
    purchaseDate: '2025-12-01', purchasePrice: 300, pickupDate: '2025-12-05', pickupLocation: '',
    transportCompany: '', status: 'restoration_work', askingPrice: 2000, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: [], privateNotes: '',
    percentComplete: 35, createdAt: '2025-12-01', updatedAt: '2026-03-10',
  },
  {
    id: 'p5', inventoryId: 'P-005', tag: 'Tag 5', colorTag: 'orange',
    brand: 'Hardman Peck', model: '', serialNumber: '114985', pianoType: 'player_piano',
    finish: '', benchIncluded: true, yearBuilt: null, yearEstimated: false,
    countryOfOrigin: 'USA', ownershipCategory: 'business_inventory', source: 'auction',
    purchaseDate: '2026-01-10', purchasePrice: 800, pickupDate: '2026-01-12', pickupLocation: '',
    transportCompany: '', status: 'awaiting_parts', askingPrice: 3500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['player-piano'], privateNotes: '',
    percentComplete: 20, createdAt: '2026-01-10', updatedAt: '2026-03-10',
  },
  {
    id: 'p6', inventoryId: 'P-006', tag: 'Tag 6', colorTag: 'dark_blue',
    brand: 'Weber', model: '', serialNumber: '45087', pianoType: 'upright',
    finish: '', benchIncluded: false, yearBuilt: null, yearEstimated: false,
    countryOfOrigin: 'USA', ownershipCategory: 'business_inventory', source: 'private_seller',
    purchaseDate: '2025-10-20', purchasePrice: 600, pickupDate: '2025-10-25', pickupLocation: '',
    transportCompany: '', status: 'ready_for_sale', askingPrice: 2800, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: [], privateNotes: '',
    percentComplete: 100, createdAt: '2025-10-20', updatedAt: '2026-03-10',
  },
  {
    id: 'p7', inventoryId: 'P-007', tag: 'Tag 7', colorTag: 'light_blue',
    brand: 'Krakauer Bros', model: '', serialNumber: '415087', pianoType: 'upright',
    finish: '', benchIncluded: false, yearBuilt: null, yearEstimated: false,
    countryOfOrigin: 'USA', ownershipCategory: 'donation_project', source: 'donation',
    purchaseDate: null, purchasePrice: null, pickupDate: '2026-01-20', pickupLocation: '',
    transportCompany: '', status: 'restoration_work', askingPrice: null, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['donation', 'artist'], privateNotes: 'Artist donation piano',
    percentComplete: 40, createdAt: '2026-01-20', updatedAt: '2026-03-10',
  },
  {
    id: 'p8', inventoryId: 'P-008', tag: 'Tag 8', colorTag: 'purple',
    brand: 'Kohler', model: '', serialNumber: '347948', pianoType: 'upright',
    finish: '', benchIncluded: true, yearBuilt: null, yearEstimated: false,
    countryOfOrigin: 'USA', ownershipCategory: 'client_piano', source: 'client_repair',
    purchaseDate: null, purchasePrice: null, pickupDate: '2026-02-01', pickupLocation: '',
    transportCompany: '', status: 'regulation', askingPrice: null, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['client-job'], privateNotes: 'Client: Mike',
    percentComplete: 60, createdAt: '2026-02-01', updatedAt: '2026-03-10',
  },
  {
    id: 'p9', inventoryId: 'P-009', tag: 'Tag 9', colorTag: 'lavender',
    brand: 'Mathushek Cunningham', model: '', serialNumber: '47290', pianoType: 'upright',
    finish: '', benchIncluded: false, yearBuilt: null, yearEstimated: true,
    countryOfOrigin: 'USA', ownershipCategory: 'restoration_archive', source: 'estate',
    purchaseDate: null, purchasePrice: null, pickupDate: null, pickupLocation: '',
    transportCompany: '', status: 'archived', askingPrice: null, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['antique'], privateNotes: 'Antique',
    percentComplete: 0, createdAt: '2024-01-01', updatedAt: '2026-03-10',
  },
  {
    id: 'p10', inventoryId: 'P-010', tag: 'Tag 10', colorTag: 'green',
    brand: 'Kimball', model: '', serialNumber: 'N/A', pianoType: 'upright',
    finish: '', benchIncluded: false, yearBuilt: null, yearEstimated: false,
    countryOfOrigin: 'USA', ownershipCategory: 'business_inventory', source: 'auction',
    purchaseDate: '2026-03-01', purchasePrice: 400, pickupDate: '2026-03-03', pickupLocation: '',
    transportCompany: '', status: 'intake_inspection', askingPrice: 1800, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: [], privateNotes: '',
    percentComplete: 5, createdAt: '2026-03-01', updatedAt: '2026-03-10',
  },
];

export const sampleInspections: Record<string, ConditionInspection> = {
  p1: {
    id: 'insp1', pianoId: 'p1', initialAssessment: 'Antique Collard & Collard upright. Very old instrument requiring full assessment and long-term restoration plan.',
    soundboard: 2, bridges: 2, pinblock: 3, strings: 2, tuningPins: 3,
    action: 2, hammers: 2, dampers: 2, keytops: 3, pedals: 3, trapwork: 3, cabinet: 3, casters: 2,
    recommendedWork: 'Full restoration: soundboard repair, action rebuild, restringing, cabinet restoration', priorityLevel: 'low',
  },
  p3: {
    id: 'insp3', pianoId: 'p3', initialAssessment: 'Kirchner baby grand in fair condition. Promising restoration candidate.',
    soundboard: 3, bridges: 3, pinblock: 4, strings: 3, tuningPins: 4,
    action: 3, hammers: 3, dampers: 3, keytops: 4, pedals: 3, trapwork: 3, cabinet: 3, casters: 4,
    recommendedWork: 'Regulation, voicing, string replacement, cabinet polish', priorityLevel: 'medium',
  },
  p6: {
    id: 'insp6', pianoId: 'p6', initialAssessment: 'Weber upright in good restored condition. Ready for sale.',
    soundboard: 4, bridges: 4, pinblock: 4, strings: 4, tuningPins: 4,
    action: 4, hammers: 4, dampers: 4, keytops: 5, pedals: 4, trapwork: 4, cabinet: 4, casters: 4,
    recommendedWork: 'Minor touch-up and final tuning', priorityLevel: 'low',
  },
  p10: {
    id: 'insp10', pianoId: 'p10', initialAssessment: 'Kimball upright just received. Initial inspection underway.',
    soundboard: 3, bridges: 3, pinblock: 3, strings: 3, tuningPins: 3,
    action: 3, hammers: 3, dampers: 3, keytops: 3, pedals: 3, trapwork: 3, cabinet: 3, casters: 3,
    recommendedWork: 'Full evaluation pending', priorityLevel: 'medium',
  },
};

export const sampleStructuralIssues: Record<string, StructuralIssues> = {
  p1: {
    pianoId: 'p1',
    soundboardCracks: true, soundboardCracksNotes: 'Multiple hairline cracks visible',
    bridgeSeparation: false, bridgeSeparationNotes: '',
    looseTuningPins: true, looseTuningPinsNotes: 'Several pins in treble section',
    rust: true, rustNotes: 'Surface rust on strings and tuning pins',
    waterDamage: false, waterDamageNotes: '',
    actionWear: true, actionWearNotes: 'Heavy wear on hammers and whippens',
    looseJoints: true, looseJointsNotes: 'Leg joints need regluing',
    pedalProblems: false, pedalProblemsNotes: '',
  },
};

export const sampleTasks: RenovationTask[] = [
  { id: 't1', pianoId: 'p1', phase: 'restoration_work', category: 'cleaning', title: 'Deep clean interior', description: 'Remove dust and debris from soundboard and action', assignee: 'Maria Chen', dueDate: '2026-04-01', status: 'done', laborHours: 4, partsUsed: '', notes: '', completionDate: '2026-03-05', createdAt: '2026-02-01' },
  { id: 't2', pianoId: 'p1', phase: 'restoration_work', category: 'soundboard_repair', title: 'Soundboard crack repair', description: 'Fill and repair hairline cracks', assignee: 'Nick West', dueDate: '2026-05-01', status: 'in_progress', laborHours: 8, partsUsed: 'Epoxy filler', notes: 'Using traditional repair methods', completionDate: null, createdAt: '2026-02-15' },
  { id: 't3', pianoId: 'p4', phase: 'restoration_work', category: 'action_rebuild', title: 'Action regulation', description: 'Full action regulation and adjustment', assignee: 'David Park', dueDate: '2026-03-25', status: 'in_progress', laborHours: 6, partsUsed: '', notes: '', completionDate: null, createdAt: '2026-02-20' },
  { id: 't4', pianoId: 'p5', phase: 'awaiting_parts', category: 'string_replacement', title: 'Replace bass strings', description: 'Order and replace worn bass strings', assignee: 'Nick West', dueDate: '2026-04-15', status: 'blocked', laborHours: 0, partsUsed: '', notes: 'Waiting on custom bass strings order', completionDate: null, createdAt: '2026-02-01' },
  { id: 't5', pianoId: 'p7', phase: 'restoration_work', category: 'cabinet_repair', title: 'Cabinet refinish', description: 'Sand and refinish cabinet for donation', assignee: 'Maria Chen', dueDate: '2026-04-01', status: 'in_progress', laborHours: 10, partsUsed: 'Lacquer, sandpaper', notes: '', completionDate: null, createdAt: '2026-02-10' },
  { id: 't6', pianoId: 'p8', phase: 'regulation', category: 'regulation', title: 'Full regulation', description: 'Complete action regulation for client piano', assignee: 'David Park', dueDate: '2026-03-20', status: 'in_progress', laborHours: 5, partsUsed: '', notes: 'Client wants medium-light touch', completionDate: null, createdAt: '2026-02-15' },
  { id: 't7', pianoId: 'p8', phase: 'regulation', category: 'voicing', title: 'Voicing', description: 'Voice hammers for warm tone', assignee: 'Nick West', dueDate: '2026-03-25', status: 'todo', laborHours: 0, partsUsed: '', notes: '', completionDate: null, createdAt: '2026-02-15' },
  { id: 't8', pianoId: 'p10', phase: 'intake_inspection', category: 'cleaning', title: 'Initial cleaning', description: 'Clean and assess condition', assignee: 'Maria Chen', dueDate: '2026-03-20', status: 'todo', laborHours: 0, partsUsed: '', notes: '', completionDate: null, createdAt: '2026-03-10' },
];

export const sampleExpenses: Expense[] = [
  { id: 'e1', pianoId: 'p2', category: 'purchase', date: '2026-02-15', vendor: 'Local Auction', amount: 500, notes: 'Auction purchase', receiptUrl: null },
  { id: 'e2', pianoId: 'p3', category: 'purchase', date: '2025-11-10', vendor: 'Estate Sale', amount: 1200, notes: '', receiptUrl: null },
  { id: 'e3', pianoId: 'p3', category: 'moving', date: '2025-11-15', vendor: 'Piano Movers Inc', amount: 450, notes: '', receiptUrl: null },
  { id: 'e4', pianoId: 'p4', category: 'purchase', date: '2025-12-01', vendor: 'Private Seller', amount: 300, notes: '', receiptUrl: null },
  { id: 'e5', pianoId: 'p4', category: 'parts', date: '2026-02-20', vendor: 'Piano Parts Supply', amount: 180, notes: 'Hammer felts', receiptUrl: null },
  { id: 'e6', pianoId: 'p5', category: 'purchase', date: '2026-01-10', vendor: 'Online Auction', amount: 800, notes: '', receiptUrl: null },
  { id: 'e7', pianoId: 'p5', category: 'moving', date: '2026-01-12', vendor: 'Self', amount: 150, notes: 'Gas + rental trailer', receiptUrl: null },
  { id: 'e8', pianoId: 'p6', category: 'purchase', date: '2025-10-20', vendor: 'Private Seller', amount: 600, notes: '', receiptUrl: null },
  { id: 'e9', pianoId: 'p6', category: 'parts', date: '2025-12-01', vendor: 'Piano Parts Supply', amount: 320, notes: 'New keytops, felts', receiptUrl: null },
  { id: 'e10', pianoId: 'p6', category: 'labor', date: '2026-01-15', vendor: 'Internal', amount: 800, notes: '16 hours restoration labor', receiptUrl: null },
  { id: 'e11', pianoId: 'p10', category: 'purchase', date: '2026-03-01', vendor: 'Auction', amount: 400, notes: '', receiptUrl: null },
  { id: 'e12', pianoId: 'p10', category: 'moving', date: '2026-03-03', vendor: 'Piano Movers Inc', amount: 350, notes: '', receiptUrl: null },
];

export const sampleBusinessCosts: Record<string, BusinessCostTracking> = {
  p2: { pianoId: 'p2', purchasePrice: 500, movingCost: 0, partsCost: 0, laborHours: 0, laborCost: 0, marketingCost: 0, totalInvestment: 500, estimatedSalePrice: null, projectedProfit: null, actualSalePrice: null },
  p3: { pianoId: 'p3', purchasePrice: 1200, movingCost: 450, partsCost: 0, laborHours: 0, laborCost: 0, marketingCost: 0, totalInvestment: 1650, estimatedSalePrice: 4500, projectedProfit: 2850, actualSalePrice: null },
  p4: { pianoId: 'p4', purchasePrice: 300, movingCost: 0, partsCost: 180, laborHours: 6, laborCost: 300, marketingCost: 0, totalInvestment: 780, estimatedSalePrice: 2000, projectedProfit: 1220, actualSalePrice: null },
  p5: { pianoId: 'p5', purchasePrice: 800, movingCost: 150, partsCost: 0, laborHours: 0, laborCost: 0, marketingCost: 0, totalInvestment: 950, estimatedSalePrice: 3500, projectedProfit: 2550, actualSalePrice: null },
  p6: { pianoId: 'p6', purchasePrice: 600, movingCost: 0, partsCost: 320, laborHours: 16, laborCost: 800, marketingCost: 0, totalInvestment: 1720, estimatedSalePrice: 2800, projectedProfit: 1080, actualSalePrice: null },
  p10: { pianoId: 'p10', purchasePrice: 400, movingCost: 350, partsCost: 0, laborHours: 0, laborCost: 0, marketingCost: 0, totalInvestment: 750, estimatedSalePrice: 1800, projectedProfit: 1050, actualSalePrice: null },
};

export const sampleClientJobs: Record<string, ClientJobTracking> = {
  p8: {
    pianoId: 'p8', clientName: 'Mike', clientContact: '', estimate: 1200,
    depositReceived: 400, workAuthorized: true, laborHours: 5, partsUsed: '',
    invoiceTotal: null, balanceDue: 800, pickupDate: null,
  },
};

export const sampleDonations: Record<string, DonationTracking> = {
  p7: {
    pianoId: 'p7', donationRecipient: 'Local Arts Center', donationStatus: 'in_progress',
    donationValue: 1500, deliveryDate: null, notes: 'Artist donation piano — restoring for community center',
  },
};

export const sampleCharacterNotes: Record<string, CharacterNotes> = {
  p1: {
    pianoId: 'p1', tonalCharacter: ['warm', 'dark'],
    actionFeel: ['heavy_action'], musicalSuitability: ['classical'],
    cabinetCharacter: ['period_antique', 'original_cabinet'],
    customShopNotes: 'Historic instrument. Rare Collard & Collard. Potential museum piece.',
  },
  p6: {
    pianoId: 'p6', tonalCharacter: ['balanced', 'warm'],
    actionFeel: ['medium_action', 'even_touch'], musicalSuitability: ['home_practice', 'teaching_studio'],
    cabinetCharacter: ['refinished_cabinet'],
    customShopNotes: 'Solid home piano. Good candidate for teaching studio.',
  },
  p8: {
    pianoId: 'p8', tonalCharacter: ['bright', 'clear_treble'],
    actionFeel: ['responsive'], musicalSuitability: ['home_practice'],
    cabinetCharacter: ['original_cabinet'],
    customShopNotes: 'Client wants warmer voicing and lighter touch.',
  },
};

export const samplePerformanceProfiles: Record<string, PerformanceProfile> = {
  p6: {
    pianoId: 'p6', pitchLevel: 'A440', lastTuningDate: '2026-02-28',
    pitchRaiseRequired: false, regulationStatus: 'Complete', voicingStatus: 'Complete',
    humiditySensitivity: 'Normal',
  },
  p8: {
    pianoId: 'p8', pitchLevel: 'A438 (low)', lastTuningDate: '2025-12-01',
    pitchRaiseRequired: true, regulationStatus: 'In Progress', voicingStatus: 'Pending',
    humiditySensitivity: 'Moderate',
  },
};

export const sampleSales: Record<string, SaleRecord> = {};

export const sampleActivity: ActivityLogEntry[] = [
  { id: 'a1', pianoId: 'p1', userId: 'u1', userName: 'Nick West', action: 'Task started', detail: 'Began soundboard crack repair on Collard & Collard', timestamp: '2026-03-10T14:30:00Z' },
  { id: 'a2', pianoId: 'p4', userId: 'u3', userName: 'David Park', action: 'Task started', detail: 'Began action regulation on Kimball', timestamp: '2026-03-08T09:15:00Z' },
  { id: 'a3', pianoId: 'p6', userId: 'u1', userName: 'Nick West', action: 'Status updated', detail: 'Weber marked ready for sale', timestamp: '2026-03-05T16:45:00Z' },
  { id: 'a4', pianoId: 'p7', userId: 'u2', userName: 'Maria Chen', action: 'Task started', detail: 'Cabinet refinish on Krakauer Bros donation piano', timestamp: '2026-03-04T10:00:00Z' },
  { id: 'a5', pianoId: 'p8', userId: 'u3', userName: 'David Park', action: 'Task started', detail: 'Full regulation for client piano Kohler', timestamp: '2026-03-03T13:20:00Z' },
  { id: 'a6', pianoId: 'p10', userId: 'u1', userName: 'Nick West', action: 'Piano added', detail: 'Added Kimball P-010 to inventory', timestamp: '2026-03-01T08:00:00Z' },
  { id: 'a7', pianoId: 'p5', userId: 'u1', userName: 'Nick West', action: 'Task blocked', detail: 'Bass strings backordered for Hardman Peck', timestamp: '2026-02-28T10:30:00Z' },
  { id: 'a8', pianoId: 'p2', userId: 'u1', userName: 'Nick West', action: 'Piano added', detail: 'Added Baldwin P-002 to inventory', timestamp: '2026-02-15T08:00:00Z' },
];
