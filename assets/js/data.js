/* ==========================================================================
   FleetSquad — Mock data
   Everything the prototype renders comes from this file. It is deliberately
   shaped like a REST payload so a Node backend can drop straight in later:
   each collection is an array of plain objects joined by string ids.
   ========================================================================== */

(function (window) {
  'use strict';

  var FS = window.FS = window.FS || {};

  /* Dates are generated relative to "today" so the prototype never looks
     stale, whenever it is opened. */
  function daysAgo(n, hour) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    if (hour != null) d.setHours(hour, (n * 7) % 60, 0, 0);
    return d.toISOString();
  }
  function daysAhead(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  var D = FS.data = {};

  /* ======================================================================
     Company + site chrome
     ====================================================================== */

  D.company = {
    name: 'FleetSquad',
    tagline: 'Mobile Fleet Maintenance',
    phone: '1-888-391-MECH',
    phoneRaw: '18883916324',
    phoneShort: '888-391-MECH',
    email: 'support@FleetSquad.com',
    website: 'www.fleetsquad.com',
    hours: 'Everyday 9am to 9pm',
    network: 'Network 24-7',
    parent: 'Mechlance Inc Company',
    year: new Date().getFullYear()
  };

  /* Live-ish counters for the homepage. */
  D.stats = [
    { icon: 'users',     value: 10000,  suffix: '+', label: 'Fleet Customers' },
    { icon: 'truck',     value: 250000, suffix: '+', label: 'Serviced Vehicles' },
    { icon: 'review',    value: 158,    suffix: '',  label: 'Reviews' },
    { icon: 'star-line', value: 4.9,    suffix: '/5', label: 'Customer Rating', decimal: true }
  ];

  D.whyPoints = [
    { icon: 'shield-badge',    title: 'ASE Master Techs',   text: 'Certified pros with the expertise to service all makes and models.' },
    { icon: 'truck-wrench',    title: 'We Come to You',     text: 'On-site service at your yard, terminal, office, or job site.' },
    { icon: 'clock',           title: 'Minimize Downtime',  text: 'Faster service means more uptime and higher productivity.' },
    { icon: 'clipboard-dollar',title: 'Transparent Pricing',text: 'Clear quotes, no surprises, and easy billing.' }
  ];

  D.brands = ['penske', 'ryder', 'avis', 'budget', 'enterprise', 'uhaul'];

  /* ======================================================================
     Services · Industries · Vehicle types
     These three collections drive the navigation, the homepage grids and the
     reusable SEO page template.
     ====================================================================== */

  D.services = [
    {
      slug: 'preventive-maintenance',
      name: 'Preventive Maintenance (PM)',
      short: 'Preventive Maintenance',
      icon: 'gear-wrench',
      image: 'assets/img/services/preventive-maintenance.jpg',
      excerpt: 'Stay ahead of breakdowns with proactive PM that extends vehicle life and improves reliability.',
      hero: 'Scheduled PM that keeps every unit in service',
      intro: 'FleetSquad builds a preventive maintenance programme around how your fleet actually runs — mileage, engine hours, duty cycle and season. Our ASE Master Techs arrive at your yard with the parts and fluids already staged, so a PM takes an hour instead of a day.',
      features: [
        { icon: 'calendar-clock', title: 'Interval tracking',   text: 'Automatic PM-A / PM-B / PM-C scheduling by mileage or engine hours.' },
        { icon: 'clipboard-check',title: '52-point inspection', text: 'Documented multi-point inspection with photos on every visit.' },
        { icon: 'truck-wrench',   title: 'Fluids and filters',  text: 'Oil, coolant, DEF, air, fuel and hydraulic service on-site.' },
        { icon: 'file-text',      title: 'Compliance records',  text: 'DOT-ready paperwork stored against each unit in your portal.' }
      ],
      bullets: [
        'Oil and filter service for gas, diesel and hybrid drivetrains',
        'Brake, tyre, suspension and steering inspection',
        'Battery, charging and starting system testing',
        'DEF and aftertreatment system checks',
        'Fluid top-off and leak detection',
        'Digital inspection report delivered the same day'
      ]
    },
    {
      slug: 'mobile-fleet-repair',
      name: 'Mobile Fleet Repairs',
      short: 'Mobile Fleet Repair',
      icon: 'truck-wrench',
      image: 'assets/img/services/mobile-fleet-repairs.jpg',
      excerpt: 'From brakes to engine diagnostics, we fix it on-site—fast, right the first time.',
      hero: 'Full-service repairs without leaving your yard',
      intro: 'A truck in a shop bay is a truck that is not earning. Our mobile repair units carry the diagnostic equipment, air tools and common wear parts needed to finish most repairs in a single visit — at your terminal, a customer site, or the roadside.',
      features: [
        { icon: 'monitor-pulse', title: 'On-site diagnostics', text: 'OEM-level scan tools for engine, ABS, transmission and body modules.' },
        { icon: 'wrench',        title: 'Wear-part repairs',   text: 'Brakes, air systems, suspension, electrical, cooling and HVAC.' },
        { icon: 'clock',         title: 'Same-day dispatch',   text: 'Most requests are assigned to a tech within the hour.' },
        { icon: 'shield',        title: 'Warranty backed',     text: '12-month / 12,000-mile warranty on parts and labour.' }
      ],
      bullets: [
        'Brake and air system repair',
        'Charging, starting and electrical faults',
        'Cooling system and radiator service',
        'Suspension, steering and driveline',
        'HVAC diagnosis and recharge',
        'Aftertreatment and sensor replacement'
      ]
    },
    {
      slug: 'mobile-diagnostics',
      name: 'Mobile Diagnostics',
      short: 'Mobile Diagnostics',
      icon: 'monitor-pulse',
      image: 'assets/img/services/mobile-diagnostics.jpg',
      excerpt: 'Advanced diagnostics at your location to find issues quickly and accurately.',
      hero: 'Find the fault before it finds your schedule',
      intro: 'Guessing is expensive. We bring OEM-level scan tools, oscilloscopes and pressure testing to your location, then hand you a written diagnosis with the fault codes, the freeze-frame data and a fixed-price repair option.',
      features: [
        { icon: 'monitor-pulse', title: 'OEM scan tools',      text: 'Cummins, Detroit, PACCAR, Ford, GM and Ram coverage.' },
        { icon: 'activity',      title: 'Live data capture',   text: 'Road-test data logging to catch intermittent faults.' },
        { icon: 'file-text',     title: 'Written diagnosis',   text: 'Codes, cause and cost — before any work is authorised.' },
        { icon: 'dollar',        title: 'Credited to repair',  text: 'Diagnostic fee is applied to the repair when you approve it.' }
      ],
      bullets: [
        'Check-engine and emissions fault diagnosis',
        'ABS, traction and stability system faults',
        'Electrical draw and charging tests',
        'Aftertreatment / DPF regeneration issues',
        'Transmission and driveline fault codes',
        'Intermittent fault data logging'
      ]
    },
    {
      slug: 'emergency-roadside',
      name: 'Emergency Roadside Service',
      short: 'Emergency Roadside',
      icon: 'tow-truck',
      image: 'assets/img/services/emergency-roadside.jpg',
      excerpt: '24/7 emergency response to get your vehicles back on the road as quickly as possible.',
      hero: 'Round-the-clock roadside response',
      intro: 'Breakdowns do not keep office hours. FleetSquad runs a 24-7 dispatch desk with technicians positioned across our service areas, so a stranded unit gets an ETA in minutes — not a queue position.',
      features: [
        { icon: 'clock',     title: '24/7/365 dispatch',  text: 'A live dispatcher answers every call, day or night.' },
        { icon: 'map-pin',   title: 'GPS dispatch',       text: 'The closest qualified tech is routed to your driver.' },
        { icon: 'truck',     title: 'Tyre and air',       text: 'Roadside tyre change, air leaks, jump-starts and fuel.' },
        { icon: 'phone-ring',title: 'Driver updates',     text: 'SMS updates to your driver and your fleet manager.' }
      ],
      bullets: [
        'Jump-starts and battery replacement',
        'Roadside tyre repair and replacement',
        'Air system and brake lock-up',
        'Fuel delivery and fuel filter changes',
        'Lock-out service',
        'Tow coordination when a repair is not possible'
      ]
    },
    {
      slug: 'scheduled-maintenance',
      name: 'Scheduled Maintenance',
      short: 'Scheduled Maintenance',
      icon: 'calendar-clock',
      image: 'assets/img/services/scheduled-maintenance.jpg',
      excerpt: 'We handle the schedule so you never miss critical maintenance again.',
      hero: 'Your maintenance calendar, managed for you',
      intro: 'We hold the schedule, chase the intervals and book the visits around your dispatch board — including overnight and weekend windows so vehicles are serviced while they are parked, not while they are needed.',
      features: [
        { icon: 'calendar',   title: 'Recurring windows', text: 'Weekly, monthly or quarterly visits at a fixed slot.' },
        { icon: 'bell',       title: 'Automatic reminders', text: 'SMS and email reminders before every scheduled visit.' },
        { icon: 'clock',      title: 'After-hours service', text: 'Overnight and weekend service to protect uptime.' },
        { icon: 'grid',       title: 'Whole-fleet view',    text: 'One calendar across every yard and every unit.' }
      ],
      bullets: [
        'Fixed recurring service windows',
        'Overnight and weekend availability',
        'Multi-site scheduling from one calendar',
        'Automatic interval tracking per unit',
        'Consolidated monthly invoicing',
        'Service history retained per vehicle'
      ]
    },
    {
      slug: 'mobile-inspections',
      name: 'Mobile Inspections',
      short: 'Mobile Inspections',
      icon: 'clipboard-check',
      image: 'assets/img/services/mobile-inspections.jpg',
      excerpt: 'DOT, pre-trip, post-trip pre-purchase, and safety inspections to keep your fleet compliant.',
      hero: 'Inspections that keep you compliant and on the road',
      intro: 'DOT annual inspections, pre-trip and post-trip checks and safety audits performed at your yard by certified inspectors, with the paperwork filed against each unit the same day.',
      features: [
        { icon: 'clipboard-check', title: 'DOT annual',     text: 'Federal annual inspection with decal issued on site.' },
        { icon: 'file-text',       title: 'Digital records',text: 'Every report stored against the unit in your portal.' },
        { icon: 'camera',          title: 'Photo evidence', text: 'Photographed defects attached to the inspection.' },
        { icon: 'shield',          title: 'Audit ready',    text: 'Export a full compliance pack in one click.' }
      ],
      bullets: [
        'DOT annual (FMCSA Appendix G) inspections',
        'Pre-trip and post-trip inspection programmes',
        'Brake and air system safety inspections',
        'Lighting and reflector compliance',
        'Load securement checks',
        'Digital records with photo evidence'
      ]
    },
    {
      slug: 'pre-purchase-inspections',
      name: 'Pre Purchase Inspections',
      short: 'Pre Purchase Inspections',
      icon: 'search',
      image: 'assets/img/services/mobile-inspections.jpg',
      excerpt: 'Know exactly what you are buying before the money moves — anywhere in our service area.',
      hero: 'Buy with the facts, not the listing',
      intro: 'Before you add a unit to the fleet, we inspect it where it stands. Compression and leak-down where applicable, full scan report, undercarriage photos and a written condition grade with an estimated cost to make it road-ready.',
      features: [
        { icon: 'search',       title: '120-point check', text: 'Mechanical, structural, electrical and cosmetic.' },
        { icon: 'monitor-pulse',title: 'Full scan report',text: 'Stored and pending codes across every module.' },
        { icon: 'camera',       title: '60+ photographs', text: 'Undercarriage, engine bay, interior and paperwork.' },
        { icon: 'dollar',       title: 'Cost to fix',     text: 'A priced list of what it needs, before you commit.' }
      ],
      bullets: [
        'Engine, transmission and driveline assessment',
        'Frame, suspension and structural review',
        'Full electronic scan and emissions readiness',
        'Tyre, brake and wear-item measurement',
        'Title, VIN and paperwork verification',
        'Written condition grade and repair estimate'
      ]
    }
  ];

  D.industries = [
    {
      slug: 'rental-car-fleets',
      name: 'Rental Car Fleets',
      icon: 'package',
      excerpt: 'Turn units around faster and keep utilisation high across every branch.',
      hero: 'Rental fleet maintenance that protects utilisation',
      intro: 'Every hour a rental unit sits unserviced is revenue you cannot bill. We service rental fleets on-branch, overnight, so cars are ready on the counter at open.',
      stats: [ { v: '4.2 hrs', l: 'Average turnaround' }, { v: '98.7%', l: 'First-visit fix rate' }, { v: '24/7', l: 'Branch coverage' } ],
      bullets: ['Overnight branch servicing', 'Rapid turnaround inspections', 'Damage assessment and photo records', 'Multi-branch scheduling', 'Consolidated monthly billing', 'Return-condition reporting']
    },
    {
      slug: 'trucking-fleets',
      name: 'Trucking Fleets',
      icon: 'truck',
      excerpt: 'DOT compliance, PM programmes and roadside cover for Class 6-8 operations.',
      hero: 'Keep Class 6-8 units earning',
      intro: 'From single-terminal carriers to multi-state operations, we run the PM programme, hold the DOT paperwork and answer the 3am roadside call.',
      stats: [ { v: '52-pt', l: 'PM inspection' }, { v: '24/7', l: 'Roadside dispatch' }, { v: '100%', l: 'DOT documented' } ],
      bullets: ['DOT annual inspections on-site', 'PM-A / PM-B / PM-C programmes', 'Air brake and aftertreatment specialists', 'Roadside breakdown response', 'ELD and telematics fault support', 'Terminal-based scheduled service']
    },
    {
      slug: 'delivery-fleets',
      name: 'Delivery Fleets',
      icon: 'package',
      excerpt: 'Route-ready vans and box trucks serviced between shifts, never during them.',
      hero: 'Service between routes, not during them',
      intro: 'Last-mile fleets run tight windows. We service your vans overnight at the depot so every unit is loaded and moving at dispatch.',
      stats: [ { v: 'Overnight', l: 'Depot service' }, { v: '< 2 hrs', l: 'Roadside ETA' }, { v: '350+', l: 'Depots served' } ],
      bullets: ['Overnight depot servicing', 'High-cycle brake and tyre programmes', 'Lift-gate and cargo door repair', 'Refrigeration unit checks', 'Seasonal readiness inspections', 'Driver-reported defect triage']
    },
    {
      slug: 'corporate-fleets',
      name: 'Corporate Fleets',
      icon: 'building',
      excerpt: 'Executive and pool vehicles serviced in the office car park, on your terms.',
      hero: 'Fleet care your employees never have to think about',
      intro: 'Pool cars, executive vehicles and sales fleets serviced in the office car park during the working day — no shuttle runs, no lost hours.',
      stats: [ { v: 'On-site', l: 'At your office' }, { v: 'Zero', l: 'Driver downtime' }, { v: '1 invoice', l: 'Per month' } ],
      bullets: ['On-site servicing at your office', 'Driver-scheduled appointments', 'Lease-return condition reports', 'Pool vehicle readiness checks', 'Consolidated corporate billing', 'Nationwide policy consistency']
    },
    {
      slug: 'construction-fleets',
      name: 'Construction Fleets',
      icon: 'briefcase',
      excerpt: 'Job-site service for pickups, dumps, and equipment support vehicles.',
      hero: 'Service that comes to the job site',
      intro: 'Moving a construction unit off-site costs a half day. Our techs come to the site, work around the crew and get the unit back into the rotation.',
      stats: [ { v: 'Job-site', l: 'Service location' }, { v: 'Same-day', l: 'Common repairs' }, { v: 'Mud-ready', l: 'Field equipped' } ],
      bullets: ['Job-site mobile service', 'Heavy-duty suspension and driveline', 'Hydraulic system service', 'Dump body and PTO repair', 'Seasonal cold-start readiness', 'Multi-site project scheduling']
    }
  ];

  D.vehicleTypes = [
    { slug: 'semi-trucks',    name: 'Semi-Trucks',    image: 'assets/img/vehicles/semi-truck.png',    excerpt: 'Class 8 tractors, sleepers and day cabs.',
      hero: 'Semi-Truck Maintenance', intro: 'Class 8 tractor service from PM-A through major driveline work, performed at your terminal by ASE Master Techs with heavy-duty certification.',
      bullets: ['Air brake service and certification', 'Aftertreatment and DPF service', 'Clutch, transmission and differential', 'Charging and starting systems', 'DOT annual inspection', 'Roadside breakdown response'] },
    { slug: 'box-trucks',     name: 'Box Trucks',     image: 'assets/img/vehicles/box-truck.png',     excerpt: 'Class 3-7 straight trucks and cube vans.',
      hero: 'Box Truck Maintenance', intro: 'Straight-truck service built around delivery duty cycles — brakes, lift gates and cargo doors kept in service between routes.',
      bullets: ['Brake and hub service', 'Lift-gate hydraulic repair', 'Cargo door and roll-up repair', 'Suspension and air-ride service', 'Scheduled PM programmes', 'DOT compliance inspections'] },
    { slug: 'pickup-trucks',  name: 'Pickup Trucks',  image: 'assets/img/vehicles/pickup-truck.png',  excerpt: 'Half-ton through dually work trucks.',
      hero: 'Pickup Truck Maintenance', intro: 'Work-truck service at the yard or the job site, from routine oil service to towing-package diagnostics and heavy-duty brake work.',
      bullets: ['Oil, filter and fluid service', 'Brake and rotor replacement', 'Towing package diagnostics', '4WD and transfer case service', 'Suspension and alignment checks', 'Seasonal readiness inspections'] },
    { slug: 'service-vans',   name: 'Service Vans',   image: 'assets/img/vehicles/service-van.png',   excerpt: 'Cargo and upfitted service vans.',
      hero: 'Service Van Maintenance', intro: 'Cargo and upfitted vans serviced overnight so your technicians start the day loaded and rolling.',
      bullets: ['Overnight depot servicing', 'Upfit and shelving inspection', 'Sliding door and latch repair', 'Auxiliary power and inverter checks', 'Brake and tyre programmes', 'Fleet graphics-safe washing'] },
    { slug: 'passenger-cars', name: 'Passenger Cars', image: 'assets/img/vehicles/passenger-car.png', excerpt: 'Pool, rental and executive vehicles.',
      hero: 'Passenger Car Maintenance', intro: 'Pool, rental and executive vehicle service performed where the car is parked, with lease-return condition reporting on request.',
      bullets: ['Scheduled manufacturer service', 'Brake, tyre and battery service', 'Diagnostics and warning lights', 'Lease-return condition reports', 'Detailing and presentation checks', 'Multi-site fleet scheduling'] }
  ];

  /* ======================================================================
     Navigation tree — consumed by both the desktop bar and the drawer
     ====================================================================== */

  D.nav = [
    { label: 'Services',   children: D.services.map(function (s) { return { label: s.short, href: 'service.html?s=' + s.slug }; }) },
    { label: 'Industries', children: D.industries.map(function (i) { return { label: i.name, href: 'industry.html?i=' + i.slug }; }) },
    { label: 'Vehicles',   children: D.vehicleTypes.map(function (v) { return { label: v.name, href: 'vehicle.html?v=' + v.slug }; }) },
    { label: 'Resources',  children: [
        { label: 'Service Areas', href: 'pages/service-areas.html' },
        { label: 'Blog',          href: 'blog.html' },
        { label: 'FAQs',          href: 'pages/faqs.html' }
    ] },
    { label: 'Company',    children: [
        { label: 'About Us', href: 'pages/about.html' },
        { label: 'Partners', href: 'pages/partners.html' },
        { label: 'Careers',  href: 'pages/careers.html' },
        { label: 'Contact',  href: 'pages/contact.html' }
    ] }
  ];

  /* ======================================================================
     Get Estimate form options
     ====================================================================== */

  D.serviceTypes = ['Fleet Repair', 'Prepurchase Inspection', 'Mobile Diagnosis', 'Preventive Maintenance', 'Roadside Service'];
  D.urgencies    = ['ASAP', 'Within 24 Hours', 'Within 48 Hours', 'Within a Week'];
  D.locations    = ['Garage', 'Parking Lot', 'Highway', 'Gated Area', 'Commercial Residence', 'Out in Grass'];

  /* Zip -> city/state used to simulate the address auto-populate. Any zip not
     listed falls back to a deterministic pick so the demo always responds. */
  D.zipLookup = {
    '10001': { city: 'New York',    state: 'NY' },
    '11201': { city: 'Brooklyn',    state: 'NY' },
    '07302': { city: 'Jersey City', state: 'NJ' },
    '19104': { city: 'Philadelphia',state: 'PA' },
    '30301': { city: 'Atlanta',     state: 'GA' },
    '33101': { city: 'Miami',       state: 'FL' },
    '60601': { city: 'Chicago',     state: 'IL' },
    '75201': { city: 'Dallas',      state: 'TX' },
    '77001': { city: 'Houston',     state: 'TX' },
    '80202': { city: 'Denver',      state: 'CO' },
    '85001': { city: 'Phoenix',     state: 'AZ' },
    '90001': { city: 'Los Angeles', state: 'CA' },
    '94102': { city: 'San Francisco',state: 'CA' },
    '98101': { city: 'Seattle',     state: 'WA' },
    '02108': { city: 'Boston',      state: 'MA' },
    '28202': { city: 'Charlotte',   state: 'NC' },
    '37201': { city: 'Nashville',   state: 'TN' },
    '63101': { city: 'St. Louis',   state: 'MO' },
    '89101': { city: 'Las Vegas',   state: 'NV' },
    '48201': { city: 'Detroit',     state: 'MI' }
  };

  D.serviceAreas = [
    { state: 'New York',      cities: ['New York', 'Brooklyn', 'Queens', 'Yonkers', 'Buffalo', 'Albany'] },
    { state: 'New Jersey',    cities: ['Jersey City', 'Newark', 'Elizabeth', 'Paterson', 'Trenton'] },
    { state: 'Pennsylvania',  cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'] },
    { state: 'Georgia',       cities: ['Atlanta', 'Savannah', 'Augusta', 'Columbus'] },
    { state: 'Florida',       cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'] },
    { state: 'Illinois',      cities: ['Chicago', 'Aurora', 'Naperville', 'Rockford'] },
    { state: 'Texas',         cities: ['Dallas', 'Houston', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'] },
    { state: 'Colorado',      cities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'] },
    { state: 'Arizona',       cities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'] },
    { state: 'California',    cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno', 'Oakland'] },
    { state: 'Washington',    cities: ['Seattle', 'Tacoma', 'Spokane', 'Bellevue'] },
    { state: 'Massachusetts', cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge'] },
    { state: 'North Carolina',cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'] },
    { state: 'Tennessee',     cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'] },
    { state: 'Michigan',      cities: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing'] },
    { state: 'Nevada',        cities: ['Las Vegas', 'Reno', 'Henderson'] }
  ];

  /* ======================================================================
     People
     ====================================================================== */

  D.customers = [
    { id: 'CUS-1001', company: 'Nexa Logistics',        firstName: 'Marcus',  lastName: 'Reed',      email: 'marcus@nexalogistics.com',  phone: '(212) 555-0142', city: 'New York',     state: 'NY', zip: '10001', fleetSize: 42, since: daysAgo(410), status: 'active' },
    { id: 'CUS-1002', company: 'BlueLine Delivery',     firstName: 'Danielle',lastName: 'Cho',       email: 'dcho@bluelinedelivery.com', phone: '(312) 555-0198', city: 'Chicago',      state: 'IL', zip: '60601', fleetSize: 128, since: daysAgo(320), status: 'active' },
    { id: 'CUS-1003', company: 'Ironbridge Construction',firstName: 'Tom',    lastName: 'Vargas',    email: 'tom@ironbridge.build',      phone: '(713) 555-0176', city: 'Houston',      state: 'TX', zip: '77001', fleetSize: 24, since: daysAgo(255), status: 'active' },
    { id: 'CUS-1004', company: 'Summit Rentals',        firstName: 'Priya',   lastName: 'Nadeem',    email: 'priya@summitrentals.com',   phone: '(602) 555-0110', city: 'Phoenix',      state: 'AZ', zip: '85001', fleetSize: 310, since: daysAgo(198), status: 'active' },
    { id: 'CUS-1005', company: 'Harborview Freight',    firstName: 'Alan',    lastName: 'Whitfield', email: 'alan@harborviewfreight.com',phone: '(206) 555-0163', city: 'Seattle',      state: 'WA', zip: '98101', fleetSize: 67, since: daysAgo(150), status: 'active' },
    { id: 'CUS-1006', company: 'Crestline Corporate',   firstName: 'Sofia',   lastName: 'Marchetti', email: 'sofia@crestlinecorp.com',   phone: '(415) 555-0184', city: 'San Francisco',state: 'CA', zip: '94102', fleetSize: 55, since: daysAgo(96),  status: 'active' },
    { id: 'CUS-1007', company: 'Redstone Haulage',      firstName: 'Jerome',  lastName: 'Baptiste',  email: 'jerome@redstonehaul.com',   phone: '(404) 555-0129', city: 'Atlanta',      state: 'GA', zip: '30301', fleetSize: 88, since: daysAgo(61),  status: 'active' },
    { id: 'CUS-1008', company: 'Cascade Courier Co.',   firstName: 'Emily',   lastName: 'Tran',      email: 'emily@cascadecourier.com',  phone: '(303) 555-0157', city: 'Denver',       state: 'CO', zip: '80202', fleetSize: 19, since: daysAgo(28),  status: 'active' }
  ];

  D.mechanics = [
    { id: 'MEC-01', name: 'Carlos Mendez',   email: 'carlos@fleetsquad.com',  phone: '(212) 555-0301', certs: 'ASE Master · Diesel', city: 'New York',      state: 'NY', rating: 4.9, jobsDone: 312, hourlyRate: 68, status: 'available' },
    { id: 'MEC-02', name: 'Derrick Hall',    email: 'derrick@fleetsquad.com', phone: '(312) 555-0302', certs: 'ASE Master · Brakes',  city: 'Chicago',       state: 'IL', rating: 4.8, jobsDone: 268, hourlyRate: 64, status: 'on-job' },
    { id: 'MEC-03', name: 'Nina Patel',      email: 'nina@fleetsquad.com',    phone: '(713) 555-0303', certs: 'ASE Master · Electrical', city: 'Houston',    state: 'TX', rating: 5.0, jobsDone: 401, hourlyRate: 72, status: 'available' },
    { id: 'MEC-04', name: 'Sam Okafor',      email: 'sam@fleetsquad.com',     phone: '(602) 555-0304', certs: 'ASE · HVAC · Diesel',  city: 'Phoenix',       state: 'AZ', rating: 4.7, jobsDone: 189, hourlyRate: 61, status: 'available' },
    { id: 'MEC-05', name: 'Ruth Delacroix',  email: 'ruth@fleetsquad.com',    phone: '(206) 555-0305', certs: 'ASE Master · Inspector',city: 'Seattle',      state: 'WA', rating: 4.9, jobsDone: 224, hourlyRate: 66, status: 'on-job' },
    { id: 'MEC-06', name: 'Victor Alvarez',  email: 'victor@fleetsquad.com',  phone: '(415) 555-0306', certs: 'ASE Master · Driveline',city: 'San Francisco',state: 'CA', rating: 4.8, jobsDone: 157, hourlyRate: 70, status: 'off-duty' }
  ];

  D.managers = [
    { id: 'MGR-01', name: 'Alicia Grant',  email: 'alicia@fleetsquad.com',  phone: '(888) 555-0401', region: 'East',    projects: 14 },
    { id: 'MGR-02', name: 'Wes Donovan',   email: 'wes@fleetsquad.com',     phone: '(888) 555-0402', region: 'Central', projects: 11 },
    { id: 'MGR-03', name: 'Kaito Ishida',  email: 'kaito@fleetsquad.com',   phone: '(888) 555-0403', region: 'West',    projects: 9 }
  ];

  /* Demo login accounts. Passwords are cosmetic — the login screen accepts
     anything and simply stores the chosen role. */
  D.users = [
    { role: 'admin',    name: 'Jordan Blake',    email: 'admin@fleetsquad.com',      password: 'demo1234', home: 'admin/index.html',    refId: null,        title: 'Platform Administrator' },
    { role: 'manager',  name: 'Alicia Grant',    email: 'manager@fleetsquad.com',    password: 'demo1234', home: 'manager/index.html',  refId: 'MGR-01',    title: 'Regional Fleet Manager' },
    { role: 'customer', name: 'Marcus Reed',     email: 'customer@fleetsquad.com',   password: 'demo1234', home: 'customer/index.html', refId: 'CUS-1001',  title: 'Nexa Logistics' },
    { role: 'mechanic', name: 'Carlos Mendez',   email: 'mechanic@fleetsquad.com',   password: 'demo1234', home: 'mechanic/index.html', refId: 'MEC-01',    title: 'ASE Master Technician' }
  ];

  /* ======================================================================
     Order lifecycle
     ====================================================================== */

  D.statusMeta = {
    'open':            { label: 'Open',                       cls: 'badge--open' },
    'assigned':        { label: 'Assigned',                   cls: 'badge--assigned' },
    'waiting-payment': { label: 'Completed — Waiting Payment',cls: 'badge--waiting' },
    'completed':       { label: 'Completed',                  cls: 'badge--completed' },
    'canceled':        { label: 'Canceled',                   cls: 'badge--canceled' },
    'needs-manager':   { label: 'Needs Manager',              cls: 'badge--manager' }
  };

  D.paymentMeta = {
    'unpaid':  { label: 'Unpaid',   cls: 'badge--danger' },
    'partial': { label: 'Partial',  cls: 'badge--warn' },
    'paid':    { label: 'Paid',     cls: 'badge--ok' },
    'refunded':{ label: 'Refunded', cls: 'badge--neutral' }
  };

  D.vehicleStatuses = ['Awaiting Parts', 'In Progress', 'Ready for Test Drive', 'Repair Complete', 'Not Started'];

  var MAKES = ['Freightliner', 'Volvo', 'Peterbilt', 'Ford', 'Chevrolet', 'Ram', 'International', 'Isuzu', 'Mercedes-Benz'];
  var MODELS = { Freightliner: 'Cascadia', Volvo: 'VNL 760', Peterbilt: '579', Ford: 'F-350', Chevrolet: 'Express 2500', Ram: 'ProMaster 3500', International: 'MV607', Isuzu: 'NPR-HD', 'Mercedes-Benz': 'Sprinter 2500' };
  var REPAIRS = [
    'Front brake pads and rotors, bleed air system',
    'Check-engine diagnosis — EGR valve replacement',
    'Alternator replacement and charging system test',
    'Full PM-B service with 52-point inspection',
    'Air dryer rebuild and leak-down test',
    'DPF cleaning and forced regeneration',
    'Steer tyre replacement and alignment',
    'HVAC recharge and blower motor replacement',
    'Wheel seal replacement, hub oil service',
    'Battery bank replacement and cable service'
  ];

  /* Build an internally consistent vehicle row. */
  function makeVehicle(i, seed, mechanicId, status) {
    var make = MAKES[(seed + i) % MAKES.length];
    var clockIn = status === 'Not Started' ? '' : ['07:30', '08:00', '08:45', '09:15'][(seed + i) % 4];
    var clockOut = (status === 'Repair Complete' || status === 'Ready for Test Drive')
      ? ['11:45', '13:20', '15:00', '16:30'][(seed + i) % 4] : '';
    var hours = clockIn && clockOut ? FS.hoursBetween(clockIn, clockOut) : 0;
    return {
      no: i + 1,
      year: 2018 + ((seed + i) % 7),
      make: make,
      model: MODELS[make],
      mileage: 42000 + ((seed * 7919 + i * 4813) % 260000),
      plate: String.fromCharCode(65 + (seed + i) % 26) + String.fromCharCode(65 + (seed * 3 + i) % 26) +
             String.fromCharCode(65 + (seed + i * 5) % 26) + '-' + (1000 + ((seed * 137 + i * 61) % 8999)),
      vin: '1FUJ' + ('GBD' + ((seed * 733 + i * 191) % 9999999)).slice(-9).toUpperCase(),
      repair: REPAIRS[(seed * 3 + i) % REPAIRS.length],
      mechanicId: mechanicId,
      visitDate: daysAhead(((seed + i) % 9) - 3),
      clockIn: clockIn,
      clockOut: clockOut,
      hours: hours,
      cost: 180 + ((seed * 53 + i * 97) % 1400),
      status: status,
      images: { before: [], after: [], paperwork: [], vin: [], photos: [], customerId: [] }
    };
  }

  function makeOrder(cfg) {
    var vehicles = [];
    for (var i = 0; i < cfg.count; i++) {
      var vs = cfg.vehicleStatuses ? cfg.vehicleStatuses[i % cfg.vehicleStatuses.length] : 'In Progress';
      vehicles.push(makeVehicle(i, cfg.seed, cfg.mechanicId, vs));
    }
    var labor = vehicles.reduce(function (s, v) { return s + v.cost; }, 0);
    return {
      id: cfg.id,
      customerId: cfg.customerId,
      serviceType: cfg.serviceType,
      urgency: cfg.urgency,
      vehicleCount: cfg.count,
      allowedVehicles: cfg.allowed || cfg.count,
      status: cfg.status,
      payment: cfg.payment,
      mechanicId: cfg.mechanicId,
      managerId: cfg.managerId,
      createdAt: cfg.createdAt,
      address: cfg.address,
      city: cfg.city,
      state: cfg.state,
      zip: cfg.zip,
      location: cfg.location,
      details: cfg.details,
      laborTotal: labor,
      partsTotal: Math.round(labor * 0.42),
      mechanicPayout: cfg.payout || Math.round(labor * 0.45),
      readyForTestDrive: cfg.readyForTestDrive || 0,
      vehicles: vehicles,
      timeline: cfg.timeline || []
    };
  }

  D.orders = [
    makeOrder({ id: 'PRJ-1232', customerId: 'CUS-1001', serviceType: 'Fleet Repair', urgency: 'Within 24 Hours',
      count: 6, status: 'assigned', payment: 'unpaid', mechanicId: 'MEC-01', managerId: 'MGR-01', seed: 3,
      createdAt: daysAgo(2, 9), address: '440 Hudson Yards Depot', city: 'New York', state: 'NY', zip: '10001',
      location: 'Garage', details: 'Six box trucks flagged during pre-trip. Brake wear and two check-engine lights. Need all six back before Monday dispatch.',
      vehicleStatuses: ['In Progress', 'Ready for Test Drive', 'Awaiting Parts', 'In Progress', 'Repair Complete', 'Not Started'],
      timeline: [
        { at: daysAgo(2, 9),  who: 'System',       text: 'Project created from Get Estimate submission' },
        { at: daysAgo(2, 11), who: 'Jordan Blake', text: 'Assigned to Carlos Mendez' },
        { at: daysAgo(1, 8),  who: 'Carlos Mendez',text: 'Clocked in on Vehicle #1' }
      ] }),
    makeOrder({ id: 'PRJ-1231', customerId: 'CUS-1004', serviceType: 'Preventive Maintenance', urgency: 'Within a Week',
      count: 12, status: 'waiting-payment', payment: 'unpaid', mechanicId: 'MEC-04', managerId: 'MGR-03', seed: 11,
      createdAt: daysAgo(9, 14), address: '2200 Sky Harbor Circle', city: 'Phoenix', state: 'AZ', zip: '85001',
      location: 'Parking Lot', details: 'Quarterly PM for the airport branch pool. Overnight window preferred, keys at the counter.',
      vehicleStatuses: ['Repair Complete'],
      timeline: [
        { at: daysAgo(9, 14), who: 'System',        text: 'Project created' },
        { at: daysAgo(8, 10), who: 'Jordan Blake',  text: 'Assigned to Sam Okafor' },
        { at: daysAgo(3, 17), who: 'Sam Okafor',    text: 'All 12 vehicles marked repair complete' },
        { at: daysAgo(3, 18), who: 'System',        text: 'Stripe payment link sent to Summit Rentals' }
      ] }),
    makeOrder({ id: 'PRJ-1230', customerId: 'CUS-1002', serviceType: 'Fleet Repair', urgency: 'ASAP',
      count: 4, status: 'needs-manager', payment: 'unpaid', mechanicId: 'MEC-02', managerId: 'MGR-02', seed: 5,
      createdAt: daysAgo(1, 7), address: '1500 W Cermak Rd Depot', city: 'Chicago', state: 'IL', zip: '60601',
      location: 'Gated Area', details: 'Two vans will not start after cold snap. Customer is asking to add two more units to the same visit — needs manager approval on quantity.',
      vehicleStatuses: ['In Progress', 'Awaiting Parts'],
      timeline: [
        { at: daysAgo(1, 7), who: 'System',        text: 'Project created' },
        { at: daysAgo(1, 8), who: 'Jordan Blake',  text: 'Assigned to Derrick Hall' },
        { at: daysAgo(0, 9), who: 'Derrick Hall',  text: 'Flagged for manager — customer requested 2 extra units' }
      ] }),
    makeOrder({ id: 'PRJ-1229', customerId: 'CUS-1003', serviceType: 'Mobile Diagnosis', urgency: 'Within 48 Hours',
      count: 2, status: 'completed', payment: 'paid', mechanicId: 'MEC-03', managerId: 'MGR-02', seed: 7,
      createdAt: daysAgo(16, 10), address: 'Lot 7, Katy Freeway Site', city: 'Houston', state: 'TX', zip: '77001',
      location: 'Out in Grass', details: 'Intermittent stall on two dump trucks. Need diagnosis and a written repair estimate.',
      vehicleStatuses: ['Repair Complete'],
      timeline: [
        { at: daysAgo(16, 10), who: 'System',      text: 'Project created' },
        { at: daysAgo(15, 9),  who: 'Jordan Blake',text: 'Assigned to Nina Patel' },
        { at: daysAgo(12, 16), who: 'Nina Patel',  text: 'Diagnosis complete, report uploaded' },
        { at: daysAgo(11, 11), who: 'System',      text: 'Payment received — $2,410.00' }
      ] }),
    makeOrder({ id: 'PRJ-1228', customerId: 'CUS-1005', serviceType: 'Roadside Service', urgency: 'ASAP',
      count: 1, status: 'completed', payment: 'paid', mechanicId: 'MEC-05', managerId: 'MGR-03', seed: 13,
      createdAt: daysAgo(21, 3), address: 'I-5 N Mile Marker 164', city: 'Seattle', state: 'WA', zip: '98101',
      location: 'Highway', details: 'Driver reports air pressure loss and locked brakes on the shoulder. Needs immediate roadside.',
      vehicleStatuses: ['Repair Complete'],
      timeline: [
        { at: daysAgo(21, 3), who: 'System',        text: 'Emergency roadside request received' },
        { at: daysAgo(21, 3), who: 'Jordan Blake',  text: 'Dispatched Ruth Delacroix — ETA 42 min' },
        { at: daysAgo(21, 6), who: 'Ruth Delacroix',text: 'Repair complete, vehicle released' }
      ] }),
    makeOrder({ id: 'PRJ-1227', customerId: 'CUS-1006', serviceType: 'Preventive Maintenance', urgency: 'Within a Week',
      count: 8, status: 'open', payment: 'unpaid', mechanicId: null, managerId: 'MGR-03', seed: 17,
      createdAt: daysAgo(0, 11), address: '88 Market Street Garage, Level B2', city: 'San Francisco', state: 'CA', zip: '94102',
      location: 'Commercial Residence', details: 'Executive pool cars due for scheduled service. Building requires 24h notice for garage access.',
      vehicleStatuses: ['Not Started'] }),
    makeOrder({ id: 'PRJ-1226', customerId: 'CUS-1007', serviceType: 'Fleet Repair', urgency: 'Within 24 Hours',
      count: 5, status: 'assigned', payment: 'partial', mechanicId: 'MEC-01', managerId: 'MGR-01', seed: 23,
      createdAt: daysAgo(4, 13), address: '9100 Fulton Industrial Blvd', city: 'Atlanta', state: 'GA', zip: '30301',
      location: 'Garage', details: 'Five tractors due for air system service ahead of a DOT audit next month.',
      vehicleStatuses: ['In Progress', 'Ready for Test Drive', 'In Progress'],
      timeline: [
        { at: daysAgo(4, 13), who: 'System',       text: 'Project created' },
        { at: daysAgo(4, 15), who: 'Jordan Blake', text: 'Assigned to Carlos Mendez' },
        { at: daysAgo(2, 10), who: 'System',       text: 'Deposit received — $1,200.00' }
      ] }),
    makeOrder({ id: 'PRJ-1225', customerId: 'CUS-1008', serviceType: 'Prepurchase Inspection', urgency: 'Within 48 Hours',
      count: 3, status: 'canceled', payment: 'refunded', mechanicId: null, managerId: 'MGR-03', seed: 29,
      createdAt: daysAgo(12, 16), address: '4400 Havana Street Auction Lot', city: 'Denver', state: 'CO', zip: '80202',
      location: 'Parking Lot', details: 'Pre-purchase inspection on three auction units. Customer withdrew from the auction.',
      vehicleStatuses: ['Not Started'],
      timeline: [
        { at: daysAgo(12, 16), who: 'System',      text: 'Project created' },
        { at: daysAgo(10, 9),  who: 'Emily Tran',  text: 'Customer canceled — withdrew from auction' },
        { at: daysAgo(10, 10), who: 'Jordan Blake',text: 'Refund issued in full' }
      ] }),
    makeOrder({ id: 'PRJ-1224', customerId: 'CUS-1002', serviceType: 'Mobile Diagnosis', urgency: 'Within 24 Hours',
      count: 2, status: 'waiting-payment', payment: 'unpaid', mechanicId: 'MEC-02', managerId: 'MGR-02', seed: 31,
      createdAt: daysAgo(6, 8), address: '1500 W Cermak Rd Depot', city: 'Chicago', state: 'IL', zip: '60601',
      location: 'Gated Area', details: 'ABS fault on two straight trucks. Diagnosis then repair authorisation.',
      vehicleStatuses: ['Repair Complete'] }),
    makeOrder({ id: 'PRJ-1223', customerId: 'CUS-1001', serviceType: 'Preventive Maintenance', urgency: 'Within a Week',
      count: 10, status: 'completed', payment: 'paid', mechanicId: 'MEC-01', managerId: 'MGR-01', seed: 37,
      createdAt: daysAgo(34, 9), address: '440 Hudson Yards Depot', city: 'New York', state: 'NY', zip: '10001',
      location: 'Garage', details: 'Monthly PM rotation for the New York depot.',
      vehicleStatuses: ['Repair Complete'] }),
    makeOrder({ id: 'PRJ-1222', customerId: 'CUS-1004', serviceType: 'Fleet Repair', urgency: 'ASAP',
      count: 3, status: 'assigned', payment: 'unpaid', mechanicId: 'MEC-04', managerId: 'MGR-03', seed: 41,
      createdAt: daysAgo(1, 15), address: '2200 Sky Harbor Circle', city: 'Phoenix', state: 'AZ', zip: '85001',
      location: 'Parking Lot', details: 'Three units failed the return inspection — brakes and one HVAC failure.',
      vehicleStatuses: ['In Progress', 'Awaiting Parts', 'In Progress'] }),
    makeOrder({ id: 'PRJ-1221', customerId: 'CUS-1005', serviceType: 'Mobile Inspections', urgency: 'Within a Week',
      count: 7, status: 'completed', payment: 'paid', mechanicId: 'MEC-05', managerId: 'MGR-03', seed: 43,
      createdAt: daysAgo(48, 10), address: '3400 Harbor Island Drive', city: 'Seattle', state: 'WA', zip: '98101',
      location: 'Gated Area', details: 'DOT annual inspections for seven tractors ahead of renewal.',
      vehicleStatuses: ['Repair Complete'] })
  ];

  /* ======================================================================
     Reviews
     ====================================================================== */

  D.reviews = [
    { id: 'REV-201', customerId: 'CUS-1001', orderId: 'PRJ-1223', name: 'Marcus Reed',      company: 'Nexa Logistics',        rating: 5, title: 'Saved us two full days of downtime', body: 'They serviced ten box trucks overnight in our own yard. Every unit was ready at 6am dispatch and the inspection reports were already in the portal. This is the first vendor that has actually understood how a depot runs.', at: daysAgo(30), status: 'published', featured: true },
    { id: 'REV-202', customerId: 'CUS-1004', orderId: 'PRJ-1231', name: 'Priya Nadeem',     company: 'Summit Rentals',        rating: 5, title: 'Utilisation went straight up',       body: 'Quarterly PM used to mean shuttling cars across town. FleetSquad comes to the branch after close and we open with a full counter. The billing is one clean invoice instead of thirty.', at: daysAgo(22), status: 'published', featured: true },
    { id: 'REV-203', customerId: 'CUS-1005', orderId: 'PRJ-1228', name: 'Alan Whitfield',   company: 'Harborview Freight',    rating: 5, title: '3am call, 42 minute ETA',            body: 'Air loss on I-5 at three in the morning. Live dispatcher, real ETA, tech on scene in 42 minutes and the truck was rolling before sunrise. Worth the contract on that night alone.', at: daysAgo(19), status: 'published', featured: true },
    { id: 'REV-204', customerId: 'CUS-1003', orderId: 'PRJ-1229', name: 'Tom Vargas',       company: 'Ironbridge Construction',rating: 4, title: 'Good diagnosis, clear estimate',     body: 'Two dump trucks with an intermittent stall that three shops could not find. Nina logged the data on a road test and had it pinned down the same day. Only knocking a star because parts took an extra day.', at: daysAgo(14), status: 'published', featured: false },
    { id: 'REV-205', customerId: 'CUS-1002', orderId: 'PRJ-1224', name: 'Danielle Cho',     company: 'BlueLine Delivery',     rating: 5, title: 'They work around our routes',        body: 'Everything happens between 9pm and 5am so our vans never miss a shift. The photo documentation on every repair has settled two damage disputes for us already.', at: daysAgo(9),  status: 'published', featured: false },
    { id: 'REV-206', customerId: 'CUS-1007', orderId: 'PRJ-1226', name: 'Jerome Baptiste',  company: 'Redstone Haulage',      rating: 5, title: 'DOT audit passed clean',             body: 'Every inspection record was already filed against the unit with photos. The auditor spent an hour instead of a day. That alone justifies the platform.', at: daysAgo(5),  status: 'published', featured: false },
    { id: 'REV-207', customerId: 'CUS-1006', orderId: null,       name: 'Sofia Marchetti',  company: 'Crestline Corporate',   rating: 4, title: 'Convenient for our pool fleet',      body: 'Servicing in the office garage means nobody loses half a day at a dealership. Scheduling around building access took a couple of tries to get right.', at: daysAgo(3),  status: 'pending', featured: false },
    { id: 'REV-208', customerId: 'CUS-1008', orderId: null,       name: 'Emily Tran',       company: 'Cascade Courier Co.',   rating: 5, title: 'Responsive and straightforward',     body: 'Quotes are clear, there are no surprise line items, and I can see exactly where every vehicle is in the process. Refund on a canceled job was handled without a fight.', at: daysAgo(1),  status: 'pending', featured: false }
  ];

  /* ======================================================================
     Notifications — simulated SMS + email traffic
     ====================================================================== */

  D.notifications = [
    { id: 'N-501', channel: 'sms',   audience: 'admin',    orderId: 'PRJ-1232', title: 'New Project #PRJ-1232',
      body: 'Service Type: Fleet Repair\nVehicles: 6\nDetails: Six box trucks flagged during pre-trip.\nCity: New York, NY', at: daysAgo(2, 9), read: false },
    { id: 'N-502', channel: 'sms',   audience: 'mechanic', orderId: 'PRJ-1232', title: 'New Project Assigned',
      body: 'Project ID: PRJ-1232\nService Type: Fleet Repair\nLocation: 440 Hudson Yards Depot, New York, NY', at: daysAgo(2, 11), read: false },
    { id: 'N-503', channel: 'email', audience: 'customer', orderId: 'PRJ-1231', title: 'Your invoice is ready',
      body: 'Project PRJ-1231 is complete. 12 vehicles serviced. Amount due $9,842.00. Pay securely with the link in this email.', at: daysAgo(3, 18), read: false },
    { id: 'N-504', channel: 'sms',   audience: 'admin',    orderId: 'PRJ-1230', title: 'Manager attention needed',
      body: 'Project PRJ-1230 flagged by Derrick Hall — customer requested 2 additional units.', at: daysAgo(0, 9), read: false },
    { id: 'N-505', channel: 'email', audience: 'customer', orderId: 'PRJ-1232', title: 'Technician assigned',
      body: 'Carlos Mendez (ASE Master) has been assigned to project PRJ-1232. First visit scheduled for tomorrow 8:00am.', at: daysAgo(2, 11), read: true },
    { id: 'N-506', channel: 'sms',   audience: 'mechanic', orderId: 'PRJ-1222', title: 'New Project Assigned',
      body: 'Project ID: PRJ-1222\nService Type: Fleet Repair\nLocation: 2200 Sky Harbor Circle, Phoenix, AZ', at: daysAgo(1, 15), read: true },
    { id: 'N-507', channel: 'email', audience: 'admin',    orderId: 'PRJ-1229', title: 'Payment received',
      body: 'Ironbridge Construction paid $2,410.00 against project PRJ-1229 via Stripe.', at: daysAgo(11, 11), read: true },
    { id: 'N-508', channel: 'email', audience: 'customer', orderId: null,       title: 'How did we do?',
      body: 'Your recent service is complete. Tell us how it went — it takes about a minute and helps other fleets choose.', at: daysAgo(4, 10), read: true },
    { id: 'N-509', channel: 'sms',   audience: 'manager',  orderId: 'PRJ-1230', title: 'Quantity change request',
      body: 'PRJ-1230 (BlueLine Delivery) requests vehicle count 4 → 6. Approve or decline in the manager portal.', at: daysAgo(0, 9), read: false },
    { id: 'N-510', channel: 'email', audience: 'mechanic', orderId: 'PRJ-1231', title: 'Payout scheduled',
      body: 'Your payout of $4,428.00 for project PRJ-1231 is scheduled for the next payment run.', at: daysAgo(2, 12), read: true }
  ];

  /* ======================================================================
     Payments ledger
     ====================================================================== */

  D.payments = [
    { id: 'PAY-8801', orderId: 'PRJ-1229', customerId: 'CUS-1003', amount: 2410,  method: 'Stripe · Visa ••4242', type: 'charge', status: 'succeeded', at: daysAgo(11, 11) },
    { id: 'PAY-8802', orderId: 'PRJ-1228', customerId: 'CUS-1005', amount: 890,   method: 'Stripe · Amex ••1009', type: 'charge', status: 'succeeded', at: daysAgo(21, 7) },
    { id: 'PAY-8803', orderId: 'PRJ-1223', customerId: 'CUS-1001', amount: 7150,  method: 'Stripe · ACH',         type: 'charge', status: 'succeeded', at: daysAgo(30, 14) },
    { id: 'PAY-8804', orderId: 'PRJ-1226', customerId: 'CUS-1007', amount: 1200,  method: 'Stripe · Visa ••7781', type: 'deposit',status: 'succeeded', at: daysAgo(2, 10) },
    { id: 'PAY-8805', orderId: 'PRJ-1225', customerId: 'CUS-1008', amount: 640,   method: 'Stripe · Refund',      type: 'refund', status: 'refunded',  at: daysAgo(10, 10) },
    { id: 'PAY-8806', orderId: 'PRJ-1221', customerId: 'CUS-1005', amount: 4380,  method: 'Stripe · ACH',         type: 'charge', status: 'succeeded', at: daysAgo(44, 12) },
    { id: 'PAY-8807', orderId: 'PRJ-1231', customerId: 'CUS-1004', amount: 9842,  method: 'Stripe · Payment link',type: 'charge', status: 'pending',   at: daysAgo(3, 18) },
    { id: 'PAY-8808', orderId: 'PRJ-1224', customerId: 'CUS-1002', amount: 1975,  method: 'Stripe · Payment link',type: 'charge', status: 'pending',   at: daysAgo(2, 16) }
  ];

  /* Mechanic payout records */
  D.payouts = [
    { id: 'PO-3301', mechanicId: 'MEC-01', orderId: 'PRJ-1223', amount: 3218, status: 'paid',      at: daysAgo(28) },
    { id: 'PO-3302', mechanicId: 'MEC-05', orderId: 'PRJ-1228', amount: 400,  status: 'paid',      at: daysAgo(20) },
    { id: 'PO-3303', mechanicId: 'MEC-03', orderId: 'PRJ-1229', amount: 1085, status: 'paid',      at: daysAgo(10) },
    { id: 'PO-3304', mechanicId: 'MEC-04', orderId: 'PRJ-1231', amount: 4428, status: 'scheduled', at: daysAgo(2) },
    { id: 'PO-3305', mechanicId: 'MEC-01', orderId: 'PRJ-1232', amount: 0,    status: 'pending',   at: null },
    { id: 'PO-3306', mechanicId: 'MEC-05', orderId: 'PRJ-1221', amount: 1971, status: 'paid',      at: daysAgo(42) }
  ];

  /* ======================================================================
     Blog
     ====================================================================== */

  D.postCategories = ['Fleet Management', 'Maintenance', 'Compliance', 'Cost Control', 'Technology'];

  D.posts = [
    { slug: 'preventive-maintenance-roi', title: 'The real ROI of preventive maintenance on a 50-truck fleet',
      category: 'Cost Control', author: 'Jordan Blake', at: daysAgo(4), read: 7,
      image: 'assets/img/services/preventive-maintenance.jpg',
      excerpt: 'We ran the numbers on a year of PM data across eleven customers. The headline: every dollar spent on scheduled PM avoided $4.20 in unplanned repair and downtime.',
      body: [
        'Unplanned downtime is the single most expensive line in a fleet budget, and it almost never shows up as a line at all. It hides inside missed deliveries, overtime, rental replacements and the slow erosion of customer trust.',
        'Over the last twelve months we tracked 611 vehicles across eleven customers, comparing units on a strict PM interval against units serviced reactively. The reactive group averaged 2.8 unplanned events per unit per year. The PM group averaged 0.6.',
        'The cost gap is wider than the event gap, because unplanned repairs happen at the worst possible time and place. A brake job scheduled in your own yard is a fraction of the same job on a shoulder at 2am.',
        'The practical takeaway is not "do more maintenance". It is "move maintenance from reactive to scheduled, and move it to where the vehicle already sits". That second half is where mobile service changes the arithmetic.'
      ] },
    { slug: 'dot-inspection-checklist', title: 'A practical DOT annual inspection checklist you can actually use',
      category: 'Compliance', author: 'Ruth Delacroix', at: daysAgo(11), read: 9,
      image: 'assets/img/services/mobile-inspections.jpg',
      excerpt: 'Appendix G is thorough but it is not written for a busy yard. Here is the same content reorganised into the order a technician actually walks the vehicle.',
      body: [
        'Federal Appendix G lists what must be inspected. It does not tell you the order to do it in, which is why inspections take longer than they need to.',
        'We reorganised the requirement into a walk order: brakes and air first while the system is cold, then steering and suspension, then lighting, then coupling and frame, then wheels and tyres, then the cab interior.',
        'Two items account for the majority of the failures we see: brake adjustment beyond the readjustment limit, and lighting or reflector defects. Both are cheap to fix and expensive to fail on.',
        'Whatever order you use, photograph every defect at the moment you find it. A defect with a timestamped photo is a record. A defect on a clipboard is an argument waiting to happen.'
      ] },
    { slug: 'winter-fleet-readiness', title: 'Winter readiness: the seven checks that prevent most cold-start failures',
      category: 'Maintenance', author: 'Derrick Hall', at: daysAgo(19), read: 6,
      image: 'assets/img/services/mobile-fleet-repairs.jpg',
      excerpt: 'Cold snaps do not create new faults. They expose the ones that were already there. These are the seven checks that catch them before the first freeze.',
      body: [
        'Every winter we see the same pattern: a fleet runs fine through autumn, the temperature drops below freezing overnight, and a third of the yard will not start in the morning.',
        'Batteries are the obvious culprit, but they are rarely the root cause. A battery that tests fine at 60°F can lose 40% of its cranking capacity at 0°F, which turns a marginal starter draw or a parasitic drain into a no-start.',
        'The seven checks: battery load test under load, parasitic draw measurement, starter current draw, glow plug or grid heater function, coolant freeze point, fuel filter and water separator, and block heater cord continuity.',
        'None of these take long. All of them are far cheaper in October than in January.'
      ] },
    { slug: 'mobile-vs-shop', title: 'Mobile service vs. the shop: when each one actually wins',
      category: 'Fleet Management', author: 'Alicia Grant', at: daysAgo(26), read: 8,
      image: 'assets/img/services/mobile-diagnostics.jpg',
      excerpt: 'Mobile is not always the answer. Here is the honest breakdown of which repairs belong at your yard and which belong in a bay.',
      body: [
        'We are a mobile service company, so it would be convenient to claim that mobile always wins. It does not, and pretending otherwise costs customers money.',
        'Mobile wins decisively on: PM services, inspections, diagnostics, brakes, electrical, HVAC, air systems, and anything where the parts are known before the technician arrives.',
        'A shop wins on: major engine internal work, transmission removal, frame straightening, alignment requiring a rack, and anything needing a lift for extended periods.',
        'The useful rule of thumb is not the size of the job but the certainty of it. If the parts and the procedure are known in advance, mobile is almost always faster and cheaper because it removes two vehicle moves from the process.'
      ] },
    { slug: 'telematics-fault-codes', title: 'Your telematics is sending fault codes. Here is how to triage them.',
      category: 'Technology', author: 'Nina Patel', at: daysAgo(38), read: 10,
      image: 'assets/img/services/mobile-diagnostics.jpg',
      excerpt: 'A modern tractor can throw hundreds of codes a month. Most of them do not matter. These are the ones that do.',
      body: [
        'Telematics platforms are very good at telling you that something happened and very bad at telling you whether it matters. The result is alert fatigue, and alert fatigue is how a real fault gets ignored.',
        'Triage codes into three buckets: stop-now, service-soon, and log-only. Stop-now covers oil pressure, coolant temperature, brake system and aftertreatment shutdown timers. Service-soon covers most emissions and sensor faults.',
        'Log-only is the biggest bucket and the one that causes the trouble, because it is full of momentary voltage and communication codes that clear themselves.',
        'Set the thresholds once, per engine family, and review them quarterly. A code list that nobody reads is worse than no code list at all.'
      ] },
    { slug: 'fleet-uptime-metrics', title: 'Four uptime metrics worth tracking (and three that waste your time)',
      category: 'Fleet Management', author: 'Wes Donovan', at: daysAgo(52), read: 7,
      image: 'assets/img/services/scheduled-maintenance.jpg',
      excerpt: 'Most fleet dashboards measure activity rather than outcomes. These four metrics actually change decisions.',
      body: [
        'The metric that matters most is vehicle availability: the percentage of your fleet that is road-ready at the start of a shift. It is simple, it is hard to game, and it maps directly to revenue.',
        'Second is mean time between failures, tracked per unit rather than per fleet. Fleet averages hide the handful of problem units that generate most of your cost.',
        'Third is first-visit fix rate. A repair that needs a second visit costs roughly double, and the second visit is almost always caused by an incomplete diagnosis rather than a difficult repair.',
        'Fourth is PM compliance rate — the percentage of scheduled services performed within their window. The three not worth tracking: total work orders, average repair cost, and technician hours. All three go up when things are going well and up when things are going badly.'
      ] }
  ];

  /* ======================================================================
     CMS pages — editable content blocks
     ====================================================================== */

  D.cmsPages = [
    { slug: 'about',         title: 'About Us',      updated: daysAgo(6),  status: 'published', sections: 4 },
    { slug: 'partners',      title: 'Partners',      updated: daysAgo(14), status: 'published', sections: 3 },
    { slug: 'careers',       title: 'Careers',       updated: daysAgo(3),  status: 'published', sections: 3 },
    { slug: 'contact',       title: 'Contact',       updated: daysAgo(21), status: 'published', sections: 2 },
    { slug: 'faqs',          title: 'FAQ',           updated: daysAgo(9),  status: 'published', sections: 1 },
    { slug: 'service-areas', title: 'Service Areas', updated: daysAgo(31), status: 'published', sections: 2 },
    { slug: 'privacy',       title: 'Privacy Policy',updated: daysAgo(120),status: 'published', sections: 1 },
    { slug: 'terms',         title: 'Terms of Service', updated: daysAgo(120), status: 'draft',  sections: 1 }
  ];

  D.faqs = [
    { q: 'How quickly can a technician reach my location?',
      a: 'Emergency roadside requests are dispatched immediately and the average on-scene time across our service areas is under 90 minutes. Standard repair and maintenance requests marked ASAP are typically assigned within the hour and scheduled the same or next day.' },
    { q: 'Do you service fleets of fewer than ten vehicles?',
      a: 'Yes. There is no minimum fleet size. Our pricing scales with the number of vehicles on a visit, so smaller fleets often combine several units into one appointment to keep the per-vehicle cost down.' },
    { q: 'What does "we come to you" actually cover?',
      a: 'Our technicians work at your yard, terminal, office car park, job site, or on the roadside. The mobile units carry diagnostic equipment, air tools, fluids and common wear parts. Work that genuinely requires a lift or a rack is the only category we refer out, and we will tell you that up front.' },
    { q: 'How is pricing calculated?',
      a: 'Every project quotes labour and parts separately, with the labour hours shown per vehicle. You approve the estimate before any work starts, and the final invoice cannot exceed the approved amount without your written authorisation.' },
    { q: 'Can I add vehicles to a project after it is created?',
      a: 'Customers can add vehicles up to the quantity approved on the project. Increasing the approved quantity requires a manager to review it, which keeps the quote and the technician schedule accurate. Your fleet manager can request the change from inside your portal.' },
    { q: 'Do you handle DOT annual inspections?',
      a: 'Yes. Our certified inspectors perform the federal annual inspection on site and issue the decal at the vehicle. The completed report is filed against the unit in your portal the same day, with photographs of any defect found.' },
    { q: 'What warranty do you offer?',
      a: 'Parts and labour carry a 12-month / 12,000-mile warranty. If a warrantable failure occurs, we return to the vehicle rather than asking you to bring it anywhere.' },
    { q: 'How do payments work?',
      a: 'Invoices are issued against the project when the work is complete. You can pay by card or ACH through a secure payment link, and fleets on a monthly agreement receive one consolidated invoice covering every visit in the period.' },
    { q: 'Can my drivers request service directly?',
      a: 'Yes, if you enable it. Driver-initiated requests route to your fleet manager for approval before a technician is dispatched, so you keep control of what gets authorised.' },
    { q: 'Which vehicle types do you service?',
      a: 'Class 1 through Class 8 — passenger cars, pickups, service vans, box trucks and semi-trucks. Our technicians hold ASE Master certification and are qualified across gasoline, diesel and hybrid drivetrains.' }
  ];

  D.partners = [
    { name: 'Penske',     logo: 'assets/img/brands/penske.png',     type: 'Fleet Operator',   text: 'Nationwide truck leasing and logistics partner across 14 metro service areas.' },
    { name: 'Ryder',      logo: 'assets/img/brands/ryder.png',      type: 'Fleet Operator',   text: 'Scheduled maintenance and roadside coverage for regional distribution fleets.' },
    { name: 'AVIS',       logo: 'assets/img/brands/avis.png',       type: 'Rental Network',   text: 'Overnight branch servicing that protects counter-ready utilisation.' },
    { name: 'Budget',     logo: 'assets/img/brands/budget.png',     type: 'Rental Network',   text: 'Turnaround inspections and damage documentation across metro branches.' },
    { name: 'Enterprise', logo: 'assets/img/brands/enterprise.png', type: 'Rental Network',   text: 'Corporate pool vehicle programmes with consolidated billing.' },
    { name: 'U-Haul',     logo: 'assets/img/brands/uhaul.png',      type: 'Fleet Operator',   text: 'Box truck and trailer service supporting high-cycle rental operations.' }
  ];

  D.jobs = [
    { title: 'ASE Master Technician — Mobile',  dept: 'Field Operations', location: 'New York, NY',      type: 'Full-time', text: 'Run your own mobile service unit across our New York territory. ASE Master certification and five years of heavy-duty experience required.' },
    { title: 'Diesel Technician',               dept: 'Field Operations', location: 'Dallas, TX',        type: 'Full-time', text: 'Class 6-8 diagnostics and repair at customer terminals. Aftertreatment and air brake experience essential.' },
    { title: 'Fleet Service Manager',           dept: 'Operations',       location: 'Chicago, IL',       type: 'Full-time', text: 'Own the schedule, the quality and the customer relationship for a book of regional fleet accounts.' },
    { title: 'Dispatch Coordinator (Overnight)',dept: 'Dispatch',         location: 'Remote (US)',       type: 'Full-time', text: 'Answer the 3am call. Route the closest qualified technician. Keep drivers informed.' },
    { title: 'Mobile Inspector — DOT Certified',dept: 'Compliance',       location: 'Seattle, WA',       type: 'Full-time', text: 'Perform federal annual inspections at customer sites and maintain the compliance record.' },
    { title: 'Field Operations Supervisor',     dept: 'Operations',       location: 'Phoenix, AZ',       type: 'Full-time', text: 'Lead a team of eight mobile technicians across the Phoenix metro service area.' }
  ];

  D.timelineValues = [
    { title: 'Founded in a single service van', year: '2016', text: 'FleetSquad started with one ASE Master Tech, one van and a conviction that fleets should not have to drive to maintenance.' },
    { title: 'First multi-state contract',      year: '2018', text: 'A regional rental network asked us to cover four states. We built the dispatch platform that still runs the business today.' },
    { title: '100,000 vehicles serviced',       year: '2021', text: 'The hundred-thousandth work order closed on a box truck in Newark, at 4:40am, in the rain.' },
    { title: 'Nationwide service network',      year: '2024', text: 'Sixteen states, a 24-7 dispatch desk and a quarter of a million vehicles serviced.' }
  ];
})(window);
