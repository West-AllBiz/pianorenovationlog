import {
  Piano, ConditionInspection, StructuralIssues, RenovationTask, Expense, SaleRecord,
  ActivityLogEntry, TeamMember, BusinessCostTracking, ClientJobTracking, DonationTracking,
  CharacterNotes, PerformanceProfile
} from '@/types/piano';

export const sampleTeam: TeamMember[] = [
  { id: 'u1', name: 'Nick', email: 'nick@nickspiano.com', role: 'admin', avatar: null, assignedPianos: 10 },
  { id: 'u2', name: 'Krista', email: 'krista@nickspiano.com', role: 'admin', avatar: null, assignedPianos: 0 },
  { id: 'u3', name: 'Sawyer', email: 'sawyer@nickspiano.com', role: 'contributor', avatar: null, assignedPianos: 0 },
  { id: 'u4', name: 'Mandy', email: 'mandy@nickspiano.com', role: 'contributor', avatar: null, assignedPianos: 0 },
];

export const samplePianos: Piano[] = [
  {
    id: 'p1', inventoryId: 'P-001', tag: 'Tag 1', colorTag: 'pink',
    brand: 'Collard & Collard', model: '', serialNumber: '3929', pianoType: 'upright',
    finish: 'Light sand, stain, clear coat — preserve natural wood character', benchIncluded: false,
    yearBuilt: 1848, yearEstimated: true,
    countryOfOrigin: 'London, England', ownershipCategory: 'restoration_archive', source: 'other',
    purchaseDate: null, purchasePrice: null, pickupDate: null, pickupLocation: '',
    transportCompany: '', status: 'evaluation', askingPrice: 3500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['antique', 'provenance', 'archive-activating'],
    privateNotes: 'Lineage traces to Longman & Broderip (1767) via Muzio Clementi\'s investment. Serial 3929 dates to c.1847–1849, two years before the Great Exhibition of 1851 at which Collard was awarded the Council Medal. Factory occupied a circular building in Camden Town with canal access. Acquired by Chappell Piano Company in 1929 — this instrument predates that acquisition by 80 years. Genuine pre-commercial era London instrument.\n\nSelling Channel: eBay (national/international), collector forums, antique dealers\nBuyer Persona: Victorian furniture collector, antique instrument enthusiast, interior designer seeking statement parlor piece, early music community\nStrategy: Lead with provenance — Clementi/Collard lineage, Camden Town factory, 1851 Exhibition context. This is a story piano.',
    percentComplete: 15, frictionScore: 4, roiHealth: 'archive', createdAt: '2024-06-01', updatedAt: '2026-03-20',
  },
  {
    id: 'p2', inventoryId: 'P-002', tag: 'Tag 2', colorTag: 'magenta',
    brand: 'Baldwin', model: '', serialNumber: '1162505', pianoType: 'upright',
    finish: 'Full high-gloss custom paint — marquee listing', benchIncluded: false,
    yearBuilt: 1985, yearEstimated: true,
    countryOfOrigin: 'United States — West Baden Springs, Indiana', ownershipCategory: 'business_inventory', source: 'auction',
    purchaseDate: '2026-02-15', purchasePrice: 500, pickupDate: null, pickupLocation: '',
    transportCompany: '', status: 'acquired', askingPrice: 5500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['marquee', 'custom-paint'],
    privateNotes: 'Founded 1862 in Cincinnati as retail, began manufacturing 1889. Grand Prix at Paris Exposition 1900 — first American piano to win. Papal Medal Rome 1923. Serial 1162505 = 1984–1986 production — among the last generation built entirely under original quality standards before Gibson acquisition (2001) shifted offshore. American-made Baldwin uprights from the 1980s are a key selling point.\n\nSelling Channel: Facebook Marketplace — strong local brand recognition\nBuyer Persona: Home decorator, piano learner\'s family, design-conscious homeowner, serious pianist who knows the Baldwin name\nStrategy: Marquee local listing. Invest in best photography. Lead with Baldwin name in title. Combine American heritage story with visual transformation angle.',
    percentComplete: 0, frictionScore: 2, roiHealth: 'strong', createdAt: '2026-02-15', updatedAt: '2026-03-20',
  },
  {
    id: 'p3', inventoryId: 'P-003', tag: 'Tag 3', colorTag: 'yellow',
    brand: 'Kirchner', model: 'American Stencil Piano', serialNumber: '22950', pianoType: 'baby_grand',
    finish: 'Full high-gloss custom paint — sanding underway', benchIncluded: true,
    yearBuilt: 1945, yearEstimated: true,
    countryOfOrigin: 'United States', ownershipCategory: 'business_inventory', source: 'estate',
    purchaseDate: '2025-11-10', purchasePrice: 1200, pickupDate: '2025-11-15', pickupLocation: '',
    transportCompany: '', status: 'cabinet_work', askingPrice: 6500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['stencil-piano', 'ivory-decision-pending', 'NAMM-certified'],
    privateNotes: '⚠ Serial corrected from 22930 to 22950 — confirmed from keyframe stamp.\n\n\'Kirchner\' is a stencil/trade name — do NOT lead with brand name in listing copy. The brand carries zero recognition value. The dual NAMM/NPMA certification seals (both stamped #316289) confirm American manufacture through a certified dealer. Plastic key covering confirms post-1940s manufacture. Warm walnut/mahogany character visible under sanding.\n\n⚠ OPEN DECISION — Ivory Key Replacement:\nOption A (Plastic): Faster to market, decorator buyer only, lower ceiling\nOption B (Ivory): Adds pianist/collector buyer pool, premium listing copy, must complete before finishing\nLegal Note: Florida allows pre-1989 ivory possession/use. NY and CA have state restrictions.\n\n⚠ DO NOT lead with \'Kirchner\' brand in any listing. Lead with the visual, NAMM certification history, and American craftsmanship angle.\n\nSelling Channel: Facebook Marketplace — decorator/visual buyer primary\nBuyer Persona A: Interior designer, stage/prop stylist, restaurant/venue owner\nBuyer Persona B (with ivory): + serious pianist, vintage instrument collector, piano teacher',
    percentComplete: 25, frictionScore: 3, roiHealth: 'strong', createdAt: '2025-11-10', updatedAt: '2026-03-20',
  },
  {
    id: 'p4', inventoryId: 'P-004', tag: 'Tag 4', colorTag: 'light_green',
    brand: 'Kimball', model: '', serialNumber: 'N/A', pianoType: 'upright',
    finish: 'Full high-gloss custom paint — emerald or deep color planned', benchIncluded: false,
    yearBuilt: null, yearEstimated: true,
    countryOfOrigin: 'United States — West Baden Springs, Indiana', ownershipCategory: 'business_inventory', source: 'private_seller',
    purchaseDate: '2025-12-01', purchasePrice: 300, pickupDate: '2025-12-05', pickupLocation: '',
    transportCompany: '', status: 'restoration_work', askingPrice: 3500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['proven-comp'],
    privateNotes: 'Founded 1857 in Chicago as dealership, began manufacturing 1887. At peak, producing ~100,000 pianos/year (250 pianos + 150 organs per day). Jasper acquired Bosendorfer (1966) and Krakauer Brothers (1980). Production ceased April 1996.\n\nNick\'s proven comparable: emerald green Kimball sold for $3,500 against $1,200 standard value — confirmed repeatable outcome.\n\nStrategy: Compare against P-010 before finalizing scope — assign premium color to whichever Kimball is in superior overall condition. The emerald sale is the anchor comp — reference it in listing copy.\n\nSelling Channel: Facebook Marketplace — proven local mover\nBuyer Persona: Home decorator, piano learner family, design-conscious homeowner',
    percentComplete: 35, frictionScore: 2, roiHealth: 'strong', createdAt: '2025-12-01', updatedAt: '2026-03-20',
  },
  {
    id: 'p5', inventoryId: 'P-005', tag: 'Tag 5', colorTag: 'orange',
    brand: 'Hardman Peck', model: '', serialNumber: '114985', pianoType: 'player_piano',
    finish: 'Full high-gloss custom paint', benchIncluded: true,
    yearBuilt: 1958, yearEstimated: true,
    countryOfOrigin: 'United States — New York', ownershipCategory: 'business_inventory', source: 'estate',
    purchaseDate: '2026-01-10', purchasePrice: 200, pickupDate: '2026-01-12', pickupLocation: '',
    transportCompany: '', status: 'awaiting_parts', askingPrice: 5500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['player-piano', 'white-house-provenance', 'list-early'],
    privateNotes: 'Hugh Hardman active in NY piano industry since 1842. Incorporated as Hardman, Peck & Company in 1905. Official piano of the Metropolitan Opera Company. Selected by Franklin D. Roosevelt as the piano of the White House in the 1940s.\n\nEnrico Caruso: \'The Hardman is the only piano I use in my apartment in New York. I also have one in my home in Florence.\'\n\nAcquired by Aeolian Corporation during the Depression. Serial 114,985 dates to c.1957–1959 (reference: serial 121,100 = 1960). Leopold Peck introduced the \'Autotone\' player mechanism in 1886.\n\nStrategy: List early (Week 1) to maximize exposure time for niche buyer. Lead with White House and Metropolitan Opera provenance. The Caruso quote is gold. List on Facebook Marketplace AND dedicated player piano collector groups (Piano World forums, Mechanical Music Digest). eBay as national secondary.\n\nSelling Channel: Facebook Marketplace + player piano collector groups\nBuyer Persona: Player piano collector/restorer, vintage Americana enthusiast, music history buff, hospitality/venue operator',
    percentComplete: 20, frictionScore: 7, roiHealth: 'watch', createdAt: '2026-01-10', updatedAt: '2026-03-20',
  },
  {
    id: 'p6', inventoryId: 'P-006', tag: 'Tag 6', colorTag: 'dark_blue',
    brand: 'Weber', model: '', serialNumber: '45087', pianoType: 'upright',
    finish: 'Full high-gloss custom paint', benchIncluded: false,
    yearBuilt: 1897, yearEstimated: true,
    countryOfOrigin: 'United States — New York City', ownershipCategory: 'business_inventory', source: 'private_seller',
    purchaseDate: '2025-10-20', purchasePrice: 600, pickupDate: '2025-10-25', pickupLocation: '',
    transportCompany: '', status: 'regulation', askingPrice: 4500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['gilded-age', 'royal-warrant'],
    privateNotes: 'Founded 1852 by Bavarian immigrant Albert Weber, opened on West Broadway NYC at age 24. Awards: Philadelphia Centennial (1876), American Exhibition London (1887), Paris Exposition (1889). c.1883 King Alphonso XIII of Spain bestowed the Royal Warrant — official piano manufacturer of the Spanish royal family.\n\nSerial 45,087 places this at c.1895–1900 (reference: serial 54,700 = 1903). Authentic original Weber built before Aeolian absorption. Explicitly marketed to the wealthy elite — not a mass-market instrument.\n\nStrategy: Royal Warrant from King of Spain and Paris Exposition awards are strong listing copy. Lead with historical detail.\n\nSelling Channel: Facebook Marketplace + collector channels\nBuyer Persona: Antique furniture collector, design-conscious homeowner, music history enthusiast, collector of Gilded Age Americana',
    percentComplete: 75, frictionScore: 3, roiHealth: 'strong', createdAt: '2025-10-20', updatedAt: '2026-03-20',
  },
  {
    id: 'p7', inventoryId: 'P-007', tag: 'Tag 7', colorTag: 'light_blue',
    brand: 'Krakauer Bros', model: '', serialNumber: '415087', pianoType: 'upright',
    finish: 'Artist-painted — hands off while commercial inventory is being finished', benchIncluded: false,
    yearBuilt: null, yearEstimated: true,
    countryOfOrigin: 'United States — New York City / Bronx', ownershipCategory: 'donation_project', source: 'donation',
    purchaseDate: null, purchasePrice: null, pickupDate: '2026-01-20', pickupLocation: '',
    transportCompany: '', status: 'restoration_work', askingPrice: null, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['donation', 'keys-for-kids', 'serial-verify-required'],
    privateNotes: '⚠ Serial 415,087 REQUIRES PHYSICAL VERIFICATION — Krakauer Bros serial numbers top out at ~86,405 in 1980 (their final production year). Serial 415,087 is outside documented production range. May be case number, part number, action stamp, or transcription error. Verify directly on plate before any listing or documentation references this number.\n\nFounded 1869 by Simon Krakauer (violinist/conductor from Kissingen, Germany, immigrated 1854) with son David and brother Julius. Factory at Cypress Avenue, 136th–137th Street, Bronx. One of very few American piano makers to survive the Great Depression without conglomerate absorption. Patented the closed-back upright case (can display in any setting). Handmade, high-quality instruments — similar philosophy to Steinway. Acquired by Kimball Piano Company in 1980, production ceased 1985.\n\nMission Note: Coordinate Keys for Kids placement target (school, community center, church) before or concurrent with artist painting, so delivery logistics are pre-arranged. The Krakauer provenance story can become part of the Keys for Kids placement narrative.',
    percentComplete: 40, frictionScore: 4, roiHealth: 'mission', createdAt: '2026-01-20', updatedAt: '2026-03-20',
  },
  {
    id: 'p8', inventoryId: 'P-008', tag: 'Tag 8', colorTag: 'purple',
    brand: 'Kohler', model: '', serialNumber: '347948', pianoType: 'upright',
    finish: '', benchIncluded: true,
    yearBuilt: null, yearEstimated: true,
    countryOfOrigin: 'United States', ownershipCategory: 'client_piano', source: 'client_repair',
    purchaseDate: null, purchasePrice: null, pickupDate: '2026-02-01', pickupLocation: '',
    transportCompany: '', status: 'final_qc', askingPrice: null, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['client-job', 'invoice-pending', 'urgent-release'],
    privateNotes: '⚠ ACTION REQUIRED — WEEK 1 DAY 1: Invoice Mike. Confirm delivery logistics. Move this piano out of the workshop immediately. This is not Nick\'s inventory — it is Mike\'s piano occupying storage. Every day it stays is revenue uncollected and space unrecovered.\n\nKohler (also known as Kohler & Campbell) — long-running American brand. Mid-to-late 20th century serial range.',
    percentComplete: 95, frictionScore: 1, roiHealth: 'client', createdAt: '2026-02-01', updatedAt: '2026-03-20',
  },
  {
    id: 'p9', inventoryId: 'P-009', tag: 'Tag 9', colorTag: 'lavender',
    brand: 'Mathushek Cunningham', model: '', serialNumber: '47290', pianoType: 'upright',
    finish: 'Light sand, stain, clear coat — preserve natural wood grain', benchIncluded: false,
    yearBuilt: 1907, yearEstimated: true,
    countryOfOrigin: 'United States — New Haven, CT / New York City', ownershipCategory: 'restoration_archive', source: 'estate',
    purchaseDate: null, purchasePrice: null, pickupDate: null, pickupLocation: '',
    transportCompany: '', status: 'evaluation', askingPrice: 3500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['antique', 'archive-activating', 'gershwin-connection'],
    privateNotes: 'Frederick Mathushek immigrated from Mannheim to New York in 1849, trained under Henri Pape in Paris, worked as scale designer for J.B. Dunham. Founded Mathushek Piano Company in New Haven 1866. Inventions include the linear bridge and equalized scale for the \'Colibri\' piano — praised for tone quality rivaling much larger instruments.\n\nSerial 47,290 dates to c.1907–1908 (references: 1900=36,000; 1910=51,000). Jacob Brothers had absorbed both Mathushek firms by this period and continued building under the Mathushek name until the 1950s.\n\n\'Cunningham\' is a dealer stamp — Cunningham Piano Company of Philadelphia (founded 1891 by Irish immigrant Patrick J. Cunningham). George Gershwin composed Porgy and Bess on a Cunningham piano — that heritage is worth noting in listing copy.\n\nStrategy: Lead with the Cunningham connection: \'Sold through the Cunningham Piano Company, Philadelphia — the storied house associated with George Gershwin.\' eBay primary. Philadelphia/Pennsylvania regional heritage forums secondary.\n\nSelling Channel: eBay (national), American antique instrument forums\nBuyer Persona: American antique collector, music history enthusiast, Mathushek specialist, Philadelphia/Pennsylvania regional heritage collector',
    percentComplete: 10, frictionScore: 4, roiHealth: 'archive', createdAt: '2024-01-01', updatedAt: '2026-03-20',
  },
  {
    id: 'p10', inventoryId: 'P-010', tag: 'Tag 10', colorTag: 'green',
    brand: 'Kimball', model: '', serialNumber: 'N/A', pianoType: 'upright',
    finish: 'Full high-gloss custom paint', benchIncluded: false,
    yearBuilt: null, yearEstimated: true,
    countryOfOrigin: 'United States — West Baden Springs, Indiana', ownershipCategory: 'business_inventory', source: 'auction',
    purchaseDate: '2026-03-01', purchasePrice: 400, pickupDate: '2026-03-03', pickupLocation: '',
    transportCompany: '', status: 'intake_inspection', askingPrice: 4500, soldPrice: null,
    soldDate: null, buyerName: null, buyerContact: null,
    tags: ['compare-p004'],
    privateNotes: 'Second Kimball in inventory. Must be assessed against P-004 before committing finish scope. Key comparison points: cabinet condition, soundboard integrity, action consistency, case geometry for finishing. Superior condition unit gets premium color and higher price target.\n\nSee P-004 for full Kimball history.\n\nStrategy: Compare P-004 vs P-010 carefully. Assign best color and highest price target to superior unit. Use different color for second Kimball to avoid cannibalization. Stagger listings by at least 1 week. Proven comp: emerald Kimball sold for $3,500.\n\nSelling Channel: Facebook Marketplace\nBuyer Persona: Home decorator, piano learner family, design-conscious homeowner',
    percentComplete: 5, frictionScore: 2, roiHealth: 'strong', createdAt: '2026-03-01', updatedAt: '2026-03-20',
  },
];

export const sampleInspections: Record<string, ConditionInspection> = {
  p1: {
    id: 'insp1', pianoId: 'p1',
    initialAssessment: 'Early Victorian Collard & Collard upright, c.1847–1849. Pre-Great Exhibition instrument. Requires full assessment — activating from archive for sale.',
    soundboard: 2, bridges: 2, pinblock: 3, strings: 2, tuningPins: 3,
    action: 2, hammers: 2, dampers: 2, keytops: 3, pedals: 3, trapwork: 3, cabinet: 3, casters: 2,
    recommendedWork: 'Light sand, stain, clear coat. Preserve natural wood character. Stabilize for display/sale — not full concert restoration.',
    priorityLevel: 'medium',
  },
  p3: {
    id: 'insp3', pianoId: 'p3',
    initialAssessment: 'Kirchner (stencil) baby grand. American-made, NAMM/NPMA certified #316289. Serial corrected to 22950. Plastic keys confirm post-1940s. Sanding underway.',
    soundboard: 3, bridges: 3, pinblock: 4, strings: 3, tuningPins: 4,
    action: 3, hammers: 3, dampers: 3, keytops: 4, pedals: 3, trapwork: 3, cabinet: 3, casters: 4,
    recommendedWork: 'Complete sanding and custom gloss paint. Ivory key replacement decision pending. Regulation, voicing.',
    priorityLevel: 'medium',
  },
  p5: {
    id: 'insp5', pianoId: 'p5',
    initialAssessment: 'Hardman Peck player piano, c.1957–1959 (Aeolian era). Player mechanism adds significant scope. Strong cabinet. Bass is surprisingly alive.',
    soundboard: 3, bridges: 3, pinblock: 2, strings: 2, tuningPins: 2,
    action: 3, hammers: 3, dampers: 3, keytops: 4, pedals: 3, trapwork: 2, cabinet: 4, casters: 3,
    recommendedWork: 'Pitch raise, full regulation, pedal repair, player mechanism evaluation. Cap total investment or escalate to Diamond decision.',
    priorityLevel: 'medium',
  },
  p6: {
    id: 'insp6', pianoId: 'p6',
    initialAssessment: 'Weber upright, c.1895–1900. Original independent Weber production (pre-Aeolian). Gilded Age instrument with Royal Warrant provenance. Regulation complete.',
    soundboard: 4, bridges: 4, pinblock: 4, strings: 4, tuningPins: 4,
    action: 4, hammers: 4, dampers: 4, keytops: 5, pedals: 4, trapwork: 4, cabinet: 4, casters: 4,
    recommendedWork: 'Custom paint finish, final tuning, listing preparation.',
    priorityLevel: 'low',
  },
  p10: {
    id: 'insp10', pianoId: 'p10',
    initialAssessment: 'Kimball upright (Jasper Corporation era). Second Kimball in inventory — compare against P-004 before committing finish scope.',
    soundboard: 3, bridges: 3, pinblock: 3, strings: 3, tuningPins: 3,
    action: 3, hammers: 3, dampers: 3, keytops: 3, pedals: 3, trapwork: 3, cabinet: 3, casters: 3,
    recommendedWork: 'Full evaluation pending. Compare with P-004 for premium color assignment.',
    priorityLevel: 'medium',
  },
};

export const sampleStructuralIssues: Record<string, StructuralIssues> = {
  p1: {
    pianoId: 'p1',
    soundboardCracks: true, soundboardCracksNotes: 'Multiple hairline cracks — expected for 1840s instrument',
    bridgeSeparation: false, bridgeSeparationNotes: '',
    looseTuningPins: true, looseTuningPinsNotes: 'Several pins in treble section',
    rust: true, rustNotes: 'Surface rust on strings and tuning pins',
    waterDamage: false, waterDamageNotes: '',
    actionWear: true, actionWearNotes: 'Heavy wear on hammers and whippens — 175+ years old',
    looseJoints: true, looseJointsNotes: 'Leg joints need regluing',
    pedalProblems: false, pedalProblemsNotes: '',
  },
  p5: {
    pianoId: 'p5',
    soundboardCracks: false, soundboardCracksNotes: '',
    bridgeSeparation: false, bridgeSeparationNotes: '',
    looseTuningPins: true, looseTuningPinsNotes: 'Multiple pins in bass section',
    rust: true, rustNotes: 'Moderate rust on strings',
    waterDamage: false, waterDamageNotes: '',
    actionWear: false, actionWearNotes: '',
    looseJoints: false, looseJointsNotes: '',
    pedalProblems: true, pedalProblemsNotes: 'Trapwork rod bent, spring missing — parts ordered',
  },
};

export const sampleTasks: RenovationTask[] = [
  // P-001 Collard & Collard
  { id: 't1', pianoId: 'p1', phase: 'restoration_work', category: 'cleaning', title: 'Deep clean interior', description: 'Remove dust and debris from soundboard and action', assignee: 'Nick', dueDate: '2026-04-01', status: 'done', laborHours: 4, partsUsed: '', notes: '', completionDate: '2026-03-05', createdAt: '2026-02-01' },
  { id: 't2', pianoId: 'p1', phase: 'evaluation', category: 'soundboard_repair', title: 'Soundboard assessment', description: 'Evaluate hairline cracks — stabilize for sale, not full concert restoration', assignee: 'Nick', dueDate: '2026-05-01', status: 'in_progress', laborHours: 8, partsUsed: 'Epoxy filler', notes: 'Using traditional repair methods. Archive → Activating for sale.', completionDate: null, createdAt: '2026-02-15' },
  // P-004 Kimball
  { id: 't3', pianoId: 'p4', phase: 'restoration_work', category: 'action_rebuild', title: 'Action regulation', description: 'Full action regulation and adjustment', assignee: 'Nick', dueDate: '2026-03-25', status: 'in_progress', laborHours: 6, partsUsed: '', notes: 'Compare condition with P-010 before finalizing finish scope', completionDate: null, createdAt: '2026-02-20' },
  // P-005 Hardman Peck
  { id: 't4', pianoId: 'p5', phase: 'awaiting_parts', category: 'string_replacement', title: 'Replace bass strings', description: 'Order and replace worn bass strings', assignee: 'Nick', dueDate: '2026-04-15', status: 'blocked', laborHours: 0, partsUsed: '', notes: 'Waiting on custom bass strings order', completionDate: null, createdAt: '2026-02-01' },
  { id: 't9', pianoId: 'p5', phase: 'awaiting_parts', category: 'pitch_raise', title: 'Pitch Raise', description: 'Required before regulation', assignee: 'Nick', dueDate: null, status: 'todo', laborHours: 1.5, partsUsed: '', notes: 'Required before regulation', completionDate: null, createdAt: '2026-03-10' },
  { id: 't10', pianoId: 'p5', phase: 'awaiting_parts', category: 'regulation', title: 'Regulation', description: 'Action geometry compromised', assignee: 'Nick', dueDate: null, status: 'in_progress', laborHours: 4, partsUsed: 'Misc felts', notes: 'Action geometry compromised', completionDate: null, createdAt: '2026-03-10' },
  { id: 't11', pianoId: 'p5', phase: 'awaiting_parts', category: 'pedal_repair', title: 'Pedal Repair', description: 'Trapwork rod and spring replacement', assignee: 'Nick', dueDate: null, status: 'blocked', laborHours: 2, partsUsed: 'Trapwork rod, spring', notes: 'Ordered — ETA unknown', completionDate: null, createdAt: '2026-03-10' },
  { id: 't12', pianoId: 'p5', phase: 'awaiting_parts', category: 'cleaning', title: 'Cleaning', description: 'Interior and cabinet cleaned', assignee: 'Nick', dueDate: null, status: 'done', laborHours: 1, partsUsed: '', notes: 'Interior and cabinet cleaned', completionDate: '2026-03-10', createdAt: '2026-03-10' },
  // P-006 Weber
  { id: 't13', pianoId: 'p6', phase: 'regulation', category: 'regulation', title: 'Full regulation', description: 'Regulation complete on Gilded Age Weber', assignee: 'Nick', dueDate: '2026-03-15', status: 'done', laborHours: 16, partsUsed: 'New keytops, felts', notes: 'Regulation complete', completionDate: '2026-03-15', createdAt: '2025-12-01' },
  // P-007 Krakauer Bros
  { id: 't5', pianoId: 'p7', phase: 'restoration_work', category: 'cabinet_repair', title: 'Cabinet prep for artist painting', description: 'Sand and prepare cabinet for artist-painted finish', assignee: 'Nick', dueDate: '2026-04-01', status: 'in_progress', laborHours: 10, partsUsed: 'Sandpaper', notes: 'Hands off while commercial inventory is being finished. Coordinate Keys for Kids placement target.', completionDate: null, createdAt: '2026-02-10' },
  // P-008 Kohler (Client — Mike)
  { id: 't6', pianoId: 'p8', phase: 'final_qc', category: 'regulation', title: 'Final QC — regulation check', description: 'Final quality check before invoicing client', assignee: 'Nick', dueDate: '2026-03-20', status: 'done', laborHours: 5, partsUsed: '', notes: 'Client wants medium-light touch', completionDate: '2026-03-18', createdAt: '2026-02-15' },
  { id: 't7', pianoId: 'p8', phase: 'final_qc', category: 'voicing', title: 'Voicing', description: 'Voice hammers for warm tone per client request', assignee: 'Nick', dueDate: '2026-03-25', status: 'done', laborHours: 3, partsUsed: '', notes: '', completionDate: '2026-03-19', createdAt: '2026-02-15' },
  // P-010 Kimball
  { id: 't8', pianoId: 'p10', phase: 'intake_inspection', category: 'cleaning', title: 'Initial cleaning & assessment', description: 'Clean and assess condition. Compare with P-004.', assignee: 'Nick', dueDate: '2026-03-20', status: 'todo', laborHours: 0, partsUsed: '', notes: 'Compare with P-004 before committing scope', completionDate: null, createdAt: '2026-03-10' },
];

export const sampleExpenses: Expense[] = [
  // P-002 Baldwin
  { id: 'e1', pianoId: 'p2', category: 'purchase', date: '2026-02-15', vendor: 'Local Auction', amount: 500, notes: 'Auction purchase', receiptUrl: null },
  // P-003 Kirchner
  { id: 'e2', pianoId: 'p3', category: 'purchase', date: '2025-11-10', vendor: 'Estate Sale', amount: 1200, notes: '', receiptUrl: null },
  { id: 'e3', pianoId: 'p3', category: 'moving', date: '2025-11-15', vendor: 'Piano Movers Inc', amount: 450, notes: '', receiptUrl: null },
  // P-004 Kimball
  { id: 'e4', pianoId: 'p4', category: 'purchase', date: '2025-12-01', vendor: 'Private Seller', amount: 300, notes: '', receiptUrl: null },
  { id: 'e5', pianoId: 'p4', category: 'parts', date: '2026-02-20', vendor: 'Piano Parts Supply', amount: 180, notes: 'Hammer felts', receiptUrl: null },
  // P-005 Hardman Peck
  { id: 'e6', pianoId: 'p5', category: 'purchase', date: '2026-01-10', vendor: 'Estate', amount: 200, notes: 'Estate purchase', receiptUrl: null },
  { id: 'e7', pianoId: 'p5', category: 'moving', date: '2026-01-12', vendor: 'Self', amount: 85, notes: 'Gas + rental trailer', receiptUrl: null },
  { id: 'e8', pianoId: 'p5', category: 'parts', date: '2026-02-20', vendor: 'Piano Parts Supply', amount: 110, notes: 'Trapwork rod, spring, misc', receiptUrl: null },
  { id: 'e9', pianoId: 'p5', category: 'labor', date: '2026-03-10', vendor: 'Internal', amount: 55, notes: 'Initial labor hours', receiptUrl: null },
  // P-006 Weber
  { id: 'e10', pianoId: 'p6', category: 'purchase', date: '2025-10-20', vendor: 'Private Seller', amount: 600, notes: '', receiptUrl: null },
  { id: 'e11', pianoId: 'p6', category: 'parts', date: '2025-12-01', vendor: 'Piano Parts Supply', amount: 320, notes: 'New keytops, felts', receiptUrl: null },
  { id: 'e12', pianoId: 'p6', category: 'labor', date: '2026-01-15', vendor: 'Internal', amount: 800, notes: '16 hours restoration labor', receiptUrl: null },
  // P-010 Kimball
  { id: 'e13', pianoId: 'p10', category: 'purchase', date: '2026-03-01', vendor: 'Auction', amount: 400, notes: '', receiptUrl: null },
  { id: 'e14', pianoId: 'p10', category: 'moving', date: '2026-03-03', vendor: 'Piano Movers Inc', amount: 350, notes: '', receiptUrl: null },
];

export const sampleBusinessCosts: Record<string, BusinessCostTracking> = {
  p2: { pianoId: 'p2', purchasePrice: 500, movingCost: 0, partsCost: 0, laborHours: 0, laborCost: 0, marketingCost: 0, totalInvestment: 500, estimatedSalePrice: 5500, projectedProfit: 5000, actualSalePrice: null },
  p3: { pianoId: 'p3', purchasePrice: 1200, movingCost: 450, partsCost: 0, laborHours: 0, laborCost: 0, marketingCost: 0, totalInvestment: 1650, estimatedSalePrice: 6500, projectedProfit: 4850, actualSalePrice: null },
  p4: { pianoId: 'p4', purchasePrice: 300, movingCost: 0, partsCost: 180, laborHours: 6, laborCost: 300, marketingCost: 0, totalInvestment: 780, estimatedSalePrice: 3500, projectedProfit: 2720, actualSalePrice: null },
  p5: { pianoId: 'p5', purchasePrice: 200, movingCost: 85, partsCost: 110, laborHours: 1, laborCost: 55, marketingCost: 0, totalInvestment: 450, estimatedSalePrice: 5500, projectedProfit: 5050, actualSalePrice: null },
  p6: { pianoId: 'p6', purchasePrice: 600, movingCost: 0, partsCost: 320, laborHours: 16, laborCost: 800, marketingCost: 0, totalInvestment: 1720, estimatedSalePrice: 4500, projectedProfit: 2780, actualSalePrice: null },
  p10: { pianoId: 'p10', purchasePrice: 400, movingCost: 350, partsCost: 0, laborHours: 0, laborCost: 0, marketingCost: 0, totalInvestment: 750, estimatedSalePrice: 4500, projectedProfit: 3750, actualSalePrice: null },
};

export const sampleClientJobs: Record<string, ClientJobTracking> = {
  p8: {
    pianoId: 'p8', clientName: 'Mike', clientContact: '', estimate: 1200,
    depositReceived: 400, workAuthorized: true, laborHours: 8, partsUsed: '',
    invoiceTotal: null, balanceDue: 800, pickupDate: null,
  },
};

export const sampleDonations: Record<string, DonationTracking> = {
  p7: {
    pianoId: 'p7', donationRecipient: 'Keys for Kids Initiative', donationStatus: 'in_progress',
    donationValue: 1500, deliveryDate: null,
    notes: 'Artist-painted donation piano. Coordinate placement target (school, community center, church) before or concurrent with artist painting. Krakauer provenance story becomes part of placement narrative. ⚠ Serial requires physical verification before documentation.',
  },
};

export const sampleCharacterNotes: Record<string, CharacterNotes> = {
  p1: {
    pianoId: 'p1', tonalCharacter: ['warm', 'dark', 'intimate_tone'],
    actionFeel: ['heavy_action'], musicalSuitability: ['classical'],
    cabinetCharacter: ['period_antique', 'original_cabinet'],
    customShopNotes: 'Historic instrument — genuine pre-commercial era London piano. Clementi/Collard lineage. c.1847–1849, predates 1851 Great Exhibition. Story piano — provenance is the product.',
  },
  p5: {
    pianoId: 'p5', tonalCharacter: ['warm', 'rich_bass'],
    actionFeel: ['heavy_action', 'needs_regulation'], musicalSuitability: ['home_practice', 'practice_instrument'],
    cabinetCharacter: ['original_cabinet', 'period_antique'],
    customShopNotes: 'Player mechanism adds significant parts and labor friction. Cap total investment or escalate to Diamond decision with full player rebuild justification. Strong cabinet. Bass is surprisingly alive. White House and Metropolitan Opera provenance — the Caruso quote is gold.',
  },
  p6: {
    pianoId: 'p6', tonalCharacter: ['balanced', 'warm'],
    actionFeel: ['medium_action', 'even_touch'], musicalSuitability: ['home_practice', 'teaching_studio'],
    cabinetCharacter: ['period_antique', 'original_cabinet'],
    customShopNotes: 'Gilded Age Weber — Royal Warrant from King Alphonso XIII of Spain, Paris Exposition 1889. Authentic original Weber built before Aeolian absorption. Not a mass-market instrument.',
  },
  p8: {
    pianoId: 'p8', tonalCharacter: ['bright', 'clear_treble'],
    actionFeel: ['responsive'], musicalSuitability: ['home_practice'],
    cabinetCharacter: ['original_cabinet'],
    customShopNotes: 'Client wants warmer voicing and lighter touch. Invoice and release immediately.',
  },
  p9: {
    pianoId: 'p9', tonalCharacter: ['warm', 'mellow'],
    actionFeel: ['medium_action'], musicalSuitability: ['home_practice', 'classical'],
    cabinetCharacter: ['period_antique', 'original_cabinet'],
    customShopNotes: 'Mathushek equalized scale design — praised for tone quality rivaling much larger instruments. Cunningham dealer stamp connects to George Gershwin\'s Porgy and Bess composition. Lead with Cunningham connection in listing copy.',
  },
};

export const samplePerformanceProfiles: Record<string, PerformanceProfile> = {
  p5: {
    pianoId: 'p5', pitchLevel: 'A440 ±15¢', lastTuningDate: null,
    pitchRaiseRequired: true, regulationStatus: 'Needed', voicingStatus: 'Needed',
    humiditySensitivity: 'Moderate sensitivity',
  },
  p6: {
    pianoId: 'p6', pitchLevel: 'A440', lastTuningDate: '2026-02-28',
    pitchRaiseRequired: false, regulationStatus: 'Complete', voicingStatus: 'Complete',
    humiditySensitivity: 'Normal',
  },
  p8: {
    pianoId: 'p8', pitchLevel: 'A438 (low)', lastTuningDate: '2025-12-01',
    pitchRaiseRequired: true, regulationStatus: 'Complete', voicingStatus: 'Complete',
    humiditySensitivity: 'Moderate',
  },
};

export const sampleSales: Record<string, SaleRecord> = {};

export const sampleActivity: ActivityLogEntry[] = [
  { id: 'a1', pianoId: 'p8', userId: 'u1', userName: 'Nick', action: '⚠ ACTION REQUIRED', detail: 'P-008 Kohler — Invoice Mike. Confirm delivery. Release piano from workshop immediately.', timestamp: '2026-03-20T08:00:00Z' },
  { id: 'a2', pianoId: 'p1', userId: 'u1', userName: 'Nick', action: 'Status changed', detail: 'P-001 Collard & Collard — Restoration Archive → Activating for Sale. Moved to Evaluation.', timestamp: '2026-03-20T09:00:00Z' },
  { id: 'a3', pianoId: 'p9', userId: 'u1', userName: 'Nick', action: 'Status changed', detail: 'P-009 Mathushek Cunningham — Restoration Archive → Activating for Sale. Moved to Evaluation.', timestamp: '2026-03-20T09:15:00Z' },
  { id: 'a4', pianoId: 'p3', userId: 'u1', userName: 'Nick', action: 'Data corrected', detail: 'P-003 Kirchner — Serial corrected from 22930 to 22950 (confirmed from keyframe stamp).', timestamp: '2026-03-19T14:00:00Z' },
  { id: 'a5', pianoId: 'p6', userId: 'u1', userName: 'Nick', action: 'Regulation complete', detail: 'P-006 Weber — Regulation complete. Ready for custom paint and listing prep.', timestamp: '2026-03-15T16:00:00Z' },
  { id: 'a6', pianoId: 'p8', userId: 'u1', userName: 'Nick', action: 'Final QC complete', detail: 'P-008 Kohler (Mike) — Voicing and regulation complete. Ready for invoice and release.', timestamp: '2026-03-19T15:00:00Z' },
  { id: 'a7', pianoId: 'p5', userId: 'u2', userName: 'Krista', action: 'ROI flagged', detail: 'P-005 Hardman Peck — ROI status set to Watch. Cap investment reminder noted.', timestamp: '2026-03-18T10:00:00Z' },
  { id: 'a8', pianoId: 'p5', userId: 'u1', userName: 'Nick', action: 'Parts ordered', detail: 'P-005 Hardman Peck — Pedal parts ordered (trapwork rod, spring). Awaiting delivery.', timestamp: '2026-03-14T11:00:00Z' },
  { id: 'a9', pianoId: 'p5', userId: 'u1', userName: 'Nick', action: 'Task completed', detail: 'P-005 Hardman Peck — Cleaning task marked complete.', timestamp: '2026-03-11T09:00:00Z' },
  { id: 'a10', pianoId: 'p5', userId: 'u1', userName: 'Nick', action: 'Intake complete', detail: 'P-005 Hardman Peck — Intake inspection completed. Friction flagged at 7/10.', timestamp: '2026-03-10T14:30:00Z' },
  { id: 'a11', pianoId: 'p10', userId: 'u1', userName: 'Nick', action: 'Piano added', detail: 'Added Kimball P-010 to inventory. Pending comparison with P-004.', timestamp: '2026-03-01T08:00:00Z' },
  { id: 'a12', pianoId: 'p2', userId: 'u1', userName: 'Nick', action: 'Piano added', detail: 'Added Baldwin P-002 to inventory. Marquee listing candidate.', timestamp: '2026-02-15T08:00:00Z' },
  { id: 'a13', pianoId: 'p7', userId: 'u1', userName: 'Nick', action: 'Serial flagged', detail: 'P-007 Krakauer Bros — Serial 415,087 flagged for physical verification. Outside documented production range.', timestamp: '2026-03-20T09:30:00Z' },
];
