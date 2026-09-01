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
    year: new Date().getFullYear(),
    /* Footer social links. Add an entry here and it appears in the footer. */
    social: [
      { icon: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/fleetsquad' },
      { icon: 'youtube',  label: 'YouTube',  href: 'https://www.youtube.com/@FleetSquad' }
    ]
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

  /* First three are the marks the mobile PSD carries, in its order. */
  D.brands = ['penske', 'ryder', 'uhaul', 'avis', 'budget', 'enterprise'];

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
        { label: 'Service Area', href: 'pages/service-areas.html' },
        { label: 'Blog',         href: 'blog.html' },
        { label: 'FAQS',         href: 'pages/faqs.html' }
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

  D.serviceTypes = ['Mobile Fleet Repair', 'Prepurchase Inspection', 'Mobile Diagnosis', 'Preventive Maintenance', 'Roadside Service'];
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

  /* Coverage map. Each row is fully editable from Admin → Service Areas:
     the state can be switched on or off, and counties and cities added or
     removed. The public "check if we are in your area" page reads the same
     records out of the store, so an edit shows up on the site immediately. */
  D.serviceAreas = [
    { id: 'SA-01', code: 'NY', state: 'New York',      active: true,
      counties: ['New York', 'Kings', 'Queens', 'Westchester', 'Erie', 'Albany'],
      cities: ['New York', 'Brooklyn', 'Queens', 'Yonkers', 'Buffalo', 'Albany'] },
    { id: 'SA-02', code: 'NJ', state: 'New Jersey',    active: true,
      counties: ['Hudson', 'Essex', 'Union', 'Passaic', 'Mercer'],
      cities: ['Jersey City', 'Newark', 'Elizabeth', 'Paterson', 'Trenton'] },
    { id: 'SA-03', code: 'PA', state: 'Pennsylvania',  active: true,
      counties: ['Philadelphia', 'Allegheny', 'Lehigh', 'Erie'],
      cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'] },
    { id: 'SA-04', code: 'GA', state: 'Georgia',       active: true,
      counties: ['Fulton', 'Chatham', 'Richmond', 'Muscogee'],
      cities: ['Atlanta', 'Savannah', 'Augusta', 'Columbus'] },
    { id: 'SA-05', code: 'FL', state: 'Florida',       active: true,
      counties: ['Miami-Dade', 'Orange', 'Hillsborough', 'Duval', 'Broward'],
      cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'] },
    { id: 'SA-06', code: 'IL', state: 'Illinois',      active: true,
      counties: ['Cook', 'Kane', 'DuPage', 'Winnebago'],
      cities: ['Chicago', 'Aurora', 'Naperville', 'Rockford'] },
    { id: 'SA-07', code: 'TX', state: 'Texas',         active: true,
      counties: ['Dallas', 'Harris', 'Travis', 'Bexar', 'Tarrant', 'El Paso'],
      cities: ['Dallas', 'Houston', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'] },
    { id: 'SA-08', code: 'CO', state: 'Colorado',      active: true,
      counties: ['Denver', 'El Paso', 'Arapahoe', 'Larimer'],
      cities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'] },
    { id: 'SA-09', code: 'AZ', state: 'Arizona',       active: true,
      counties: ['Maricopa', 'Pima'],
      cities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'] },
    { id: 'SA-10', code: 'CA', state: 'California',    active: true,
      counties: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno', 'Alameda'],
      cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno', 'Oakland'] },
    { id: 'SA-11', code: 'WA', state: 'Washington',    active: true,
      counties: ['King', 'Pierce', 'Spokane'],
      cities: ['Seattle', 'Tacoma', 'Spokane', 'Bellevue'] },
    { id: 'SA-12', code: 'MA', state: 'Massachusetts', active: true,
      counties: ['Suffolk', 'Worcester', 'Hampden', 'Middlesex'],
      cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge'] },
    { id: 'SA-13', code: 'NC', state: 'North Carolina',active: true,
      counties: ['Mecklenburg', 'Wake', 'Guilford', 'Durham'],
      cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'] },
    { id: 'SA-14', code: 'TN', state: 'Tennessee',     active: true,
      counties: ['Davidson', 'Shelby', 'Knox', 'Hamilton'],
      cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'] },
    { id: 'SA-15', code: 'MI', state: 'Michigan',      active: true,
      counties: ['Wayne', 'Kent', 'Washtenaw', 'Ingham'],
      cities: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing'] },
    { id: 'SA-16', code: 'NV', state: 'Nevada',        active: true,
      counties: ['Clark', 'Washoe'],
      cities: ['Las Vegas', 'Reno', 'Henderson'] }
  ];

  /* Every US state, so the coverage map can shade the ones we are not in yet
     and the admin screen can offer them when adding a new area. */
  D.usStates = [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
    ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['FL', 'Florida'], ['GA', 'Georgia'],
    ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
    ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
    ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'],
    ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'],
    ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
    ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
    ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
    ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming']
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
    { id: 'MEC-01', name: 'Carlos Mendez',   email: 'carlos@fleetsquad.com',  phone: '(212) 555-0301', certs: 'ASE Master · Diesel', city: 'New York',      state: 'NY', rating: 4.9, jobsDone: 312, hourlyRate: 68, status: 'available', since: daysAgo(520) },
    { id: 'MEC-02', name: 'Derrick Hall',    email: 'derrick@fleetsquad.com', phone: '(312) 555-0302', certs: 'ASE Master · Brakes',  city: 'Chicago',       state: 'IL', rating: 4.8, jobsDone: 268, hourlyRate: 64, status: 'on-job', since: daysAgo(430) },
    { id: 'MEC-03', name: 'Nina Patel',      email: 'nina@fleetsquad.com',    phone: '(713) 555-0303', certs: 'ASE Master · Electrical', city: 'Houston',    state: 'TX', rating: 5.0, jobsDone: 401, hourlyRate: 72, status: 'available', since: daysAgo(365) },
    { id: 'MEC-04', name: 'Sam Okafor',      email: 'sam@fleetsquad.com',     phone: '(602) 555-0304', certs: 'ASE · HVAC · Diesel',  city: 'Phoenix',       state: 'AZ', rating: 4.7, jobsDone: 189, hourlyRate: 61, status: 'available', since: daysAgo(240) },
    { id: 'MEC-05', name: 'Ruth Delacroix',  email: 'ruth@fleetsquad.com',    phone: '(206) 555-0305', certs: 'ASE Master · Inspector',city: 'Seattle',      state: 'WA', rating: 4.9, jobsDone: 224, hourlyRate: 66, status: 'on-job', since: daysAgo(150) },
    { id: 'MEC-06', name: 'Victor Alvarez',  email: 'victor@fleetsquad.com',  phone: '(415) 555-0306', certs: 'ASE Master · Driveline',city: 'San Francisco',state: 'CA', rating: 4.8, jobsDone: 157, hourlyRate: 70, status: 'off-duty', since: daysAgo(64) }
  ];

  D.managers = [
    { id: 'MGR-01', name: 'Alicia Grant',  email: 'alicia@fleetsquad.com',  phone: '(888) 555-0401', region: 'East',    projects: 14, city: 'New York', state: 'NY', since: daysAgo(700) },
    { id: 'MGR-02', name: 'Wes Donovan',   email: 'wes@fleetsquad.com',     phone: '(888) 555-0402', region: 'Central', projects: 11, city: 'Chicago', state: 'IL', since: daysAgo(520) },
    { id: 'MGR-03', name: 'Kaito Ishida',  email: 'kaito@fleetsquad.com',   phone: '(888) 555-0403', region: 'West',    projects: 9, city: 'San Francisco', state: 'CA', since: daysAgo(300) }
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
    makeOrder({ id: 'PRJ-1232', customerId: 'CUS-1001', serviceType: 'Mobile Fleet Repair', urgency: 'Within 24 Hours',
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
    makeOrder({ id: 'PRJ-1230', customerId: 'CUS-1002', serviceType: 'Mobile Fleet Repair', urgency: 'ASAP',
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
    makeOrder({ id: 'PRJ-1226', customerId: 'CUS-1007', serviceType: 'Mobile Fleet Repair', urgency: 'Within 24 Hours',
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
    makeOrder({ id: 'PRJ-1222', customerId: 'CUS-1004', serviceType: 'Mobile Fleet Repair', urgency: 'ASAP',
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
      body: 'Service Type: Mobile Fleet Repair\nVehicles: 6\nDetails: Six box trucks flagged during pre-trip.\nCity: New York, NY', at: daysAgo(2, 9), read: false },
    { id: 'N-502', channel: 'sms',   audience: 'mechanic', orderId: 'PRJ-1232', title: 'New Project Assigned',
      body: 'Project ID: PRJ-1232\nService Type: Mobile Fleet Repair\nLocation: 440 Hudson Yards Depot, New York, NY', at: daysAgo(2, 11), read: false },
    { id: 'N-503', channel: 'email', audience: 'customer', orderId: 'PRJ-1231', title: 'Your invoice is ready',
      body: 'Project PRJ-1231 is complete. 12 vehicles serviced. Amount due $9,842.00. Pay securely with the link in this email.', at: daysAgo(3, 18), read: false },
    { id: 'N-504', channel: 'sms',   audience: 'admin',    orderId: 'PRJ-1230', title: 'Manager attention needed',
      body: 'Project PRJ-1230 flagged by Derrick Hall — customer requested 2 additional units.', at: daysAgo(0, 9), read: false },
    { id: 'N-505', channel: 'email', audience: 'customer', orderId: 'PRJ-1232', title: 'Technician assigned',
      body: 'Carlos Mendez (ASE Master) has been assigned to project PRJ-1232. First visit scheduled for tomorrow 8:00am.', at: daysAgo(2, 11), read: true },
    { id: 'N-506', channel: 'sms',   audience: 'mechanic', orderId: 'PRJ-1222', title: 'New Project Assigned',
      body: 'Project ID: PRJ-1222\nService Type: Mobile Fleet Repair\nLocation: 2200 Sky Harbor Circle, Phoenix, AZ', at: daysAgo(1, 15), read: true },
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

  /* Every post carries its own SEO record and a list of sibling slugs, so the
     blog editor can cross-link articles without touching the markup. Defaults
     are filled in here rather than repeated on each object above. */
  D.posts.forEach(function (p, i) {
    p.status         = p.status || 'published';
    p.metaTitle      = p.metaTitle || p.title + ' | FleetSquad';
    p.metaDescription = p.metaDescription || p.excerpt.slice(0, 155);
    p.keywords       = p.keywords || ['fleet maintenance', p.category.toLowerCase(), 'mobile fleet service'].join(', ');
    // Seed each article with the two that follow it so the "related" rail is
    // populated out of the box; every link is editable in the admin.
    p.related = p.related || [
      D.posts[(i + 1) % D.posts.length].slug,
      D.posts[(i + 2) % D.posts.length].slug
    ];
  });

  /* ======================================================================
     CMS pages — editable content blocks
     ====================================================================== */

  D.cmsPages = [
    { slug: 'about', title: 'About Us', updated: daysAgo(6), status: 'published', sections: 4,
      heading: 'Mobile fleet maintenance, built around uptime',
      lead: 'We started FleetSquad because a vehicle driven to a shop is already costing you money.',
      metaTitle: 'About FleetSquad | Mobile Fleet Maintenance Company',
      metaDescription: 'FleetSquad is a nationwide mobile fleet maintenance company. ASE Master Techs service your trucks, vans and cars at your yard, terminal or job site.',
      keywords: 'about fleetsquad, mobile fleet maintenance company, ase master techs' },
    { slug: 'partners', title: 'Partners', updated: daysAgo(14), status: 'published', sections: 3,
      heading: 'The fleets and networks we run with',
      lead: 'National rental, leasing and logistics networks trust FleetSquad with their uptime.',
      metaTitle: 'Fleet Maintenance Partners | FleetSquad',
      metaDescription: 'FleetSquad partners with national rental, leasing and logistics networks to deliver consistent mobile maintenance across every market they operate in.',
      keywords: 'fleet maintenance partners, fleet service network, mobile maintenance partner' },
    { slug: 'careers', title: 'Careers', updated: daysAgo(3), status: 'published', sections: 3,
      heading: 'Build a career in the field, not in a bay',
      lead: 'ASE Master Techs, dispatchers and operations people wanted across every market.',
      metaTitle: 'Careers & Mobile Technician Jobs | FleetSquad',
      metaDescription: 'Hiring ASE Master Techs, mobile diesel technicians, dispatchers and operations staff across our national service areas. See open FleetSquad roles.',
      keywords: 'mobile mechanic jobs, diesel technician careers, ase master tech jobs' },
    { slug: 'contact', title: 'Contact', updated: daysAgo(21), status: 'published', sections: 2,
      heading: 'Talk to a fleet coordinator',
      lead: 'Call, email or send us the details and we will come back the same day.',
      metaTitle: 'Contact FleetSquad | 1-888-391-MECH',
      metaDescription: 'Reach FleetSquad on 1-888-391-MECH, everyday 9am to 9pm, with a 24-7 dispatch network. Send us your fleet details and we will respond the same day.',
      keywords: 'contact fleetsquad, fleet service phone number, mobile fleet repair contact' },
    { slug: 'faqs', title: 'FAQs', updated: daysAgo(9), status: 'published', sections: 1,
      heading: 'Frequently asked questions',
      lead: 'Everything fleet managers ask us before their first visit.',
      metaTitle: 'Mobile Fleet Maintenance FAQs | FleetSquad',
      metaDescription: 'How fast we arrive, how pricing works, what mobile service covers, DOT inspections, warranty and payment terms — answered for fleet managers.',
      keywords: 'fleet maintenance faq, mobile mechanic questions, dot inspection faq' },
    { slug: 'service-areas', title: 'Service Area', updated: daysAgo(31), status: 'published', sections: 2,
      heading: 'Check if we are in your area',
      lead: 'Search by city, county or state to see the coverage nearest you.',
      metaTitle: 'Service Areas & Coverage Map | FleetSquad',
      metaDescription: 'See every state, county and metro FleetSquad covers. Search your city to confirm mobile fleet maintenance and roadside coverage in your area.',
      keywords: 'fleet service areas, mobile mechanic coverage map, fleet repair near me' },
    { slug: 'privacy', title: 'Privacy Policy', updated: daysAgo(120), status: 'published', sections: 1,
      heading: 'Privacy policy', lead: 'How we handle the information you share with us.',
      metaTitle: 'Privacy Policy | FleetSquad',
      metaDescription: 'How FleetSquad collects, uses, shares and retains customer and fleet information, and the choices available to you.',
      keywords: 'privacy policy, data protection' },
    { slug: 'terms', title: 'Terms of Service', updated: daysAgo(120), status: 'draft', sections: 1,
      heading: 'Terms of service', lead: 'The terms that govern the work we do for you.',
      metaTitle: 'Terms of Service | FleetSquad',
      metaDescription: 'The terms covering FleetSquad estimates, authorisation, site access, warranty, payment and liability for mobile fleet maintenance work.',
      keywords: 'terms of service, fleet repair terms' }
  ];

  /* ----------------------------------------------------------------------
     Editable page bodies
     The four pages the client asked to be able to rewrite carry their copy as
     a list of sections instead of markup, so Admin → CMS Pages can edit them.
     `style: 'quote'` renders as a pull quote; anything else is prose, and a
     blank line inside `text` starts a new paragraph. Markdown links work.
     ---------------------------------------------------------------------- */
  D.pageBlocks = {
    about: [
      { heading: '', style: 'text', text:
        'FleetSquad exists because of a simple observation: a vehicle that has to be driven to maintenance is a vehicle that is already costing you money. Every mile to a shop, every hour in a waiting bay and every rental replacement is time your fleet is not earning.\n\n' +
        'We started in 2016 with one ASE Master Technician and one service van. Today we run a nationwide network of mobile technicians, a 24-7 dispatch desk and a platform that keeps every inspection, photograph and invoice attached to the vehicle it belongs to.' },
      { heading: 'What we believe', style: 'text', text:
        'Maintenance should be scheduled, documented and invisible to the people who depend on the vehicle. Our job is to make the fleet manager\'s week quieter, not busier.' },
      { heading: '', style: 'quote', text:
        'The hundred-thousandth work order closed on a box truck in Newark, at 4:40am, in the rain. That is the job.' }
    ],

    contact: [
      { heading: '', style: 'text', text:
        'Call dispatch for anything urgent, or send the form and a coordinator replies within one business hour. Tell us the vehicles, the location and what the unit is doing, and we can usually quote from that.' }
    ],

    privacy: [
      { heading: 'Information we collect', style: 'text', text:
        'We collect the contact and fleet details you provide when you request an estimate or create an account: name, company, phone number, email address, service address and the vehicle information needed to perform the work.' },
      { heading: 'How we use it', style: 'text', text:
        'To schedule and perform your service, to send you project updates by SMS and email, to invoice you, and to maintain the maintenance and compliance record attached to each vehicle.' },
      { heading: 'Sharing', style: 'text', text:
        'We share your information with the technician assigned to your project and with our payment processor. We do not sell customer data.' },
      { heading: 'Retention', style: 'text', text:
        'Maintenance and inspection records are retained for the period required by federal and state regulation. You may request deletion of everything not subject to a retention requirement.' },
      { heading: 'Your choices', style: 'text', text:
        'You can opt out of marketing messages at any time. Transactional messages about an active project cannot be disabled while the project is open.' },
      { heading: 'Contact', style: 'text', text:
        'Questions about this policy can be sent to ' + D.company.email + '.' }
    ],

    terms: [
      { heading: 'Services', style: 'text', text:
        'FleetSquad provides mobile fleet maintenance, repair, diagnostic and inspection services at the location you specify. Scope and pricing are confirmed in a written estimate that you approve before work begins.' },
      { heading: 'Estimates and authorisation', style: 'text', text:
        'No work is performed without your authorisation. A final invoice may not exceed an approved estimate without your written agreement to the additional scope.' },
      { heading: 'Access and safety', style: 'text', text:
        'You are responsible for providing safe and lawful access to the vehicles, including keys, gate codes and a work area that meets applicable safety requirements.' },
      { heading: 'Warranty', style: 'text', text:
        'Parts and labour carry a 12-month / 12,000-mile warranty. Warranty service is performed at the vehicle. The warranty does not cover damage from misuse, accident or unauthorised repair.' },
      { heading: 'Payment', style: 'text', text:
        'Invoices are due on the terms stated on the invoice. Accounts on a monthly agreement receive one consolidated invoice per period.' },
      { heading: 'Limitation of liability', style: 'text', text:
        'Our liability for any claim is limited to the amount paid for the service giving rise to the claim.' }
    ]
  };

  /* Attach the bodies to their page records, and give Contact its map. The
     map is a plain Google embed — no API key, no account, nothing to bill. */
  D.cmsPages.forEach(function (p) {
    if (D.pageBlocks[p.slug]) p.blocks = D.pageBlocks[p.slug];
    if (p.slug === 'privacy' || p.slug === 'terms') p.showUpdated = true;
  });
  D.cmsPages.forEach(function (p) {
    if (p.slug !== 'contact') return;
    p.mapAddress = 'New York, NY';
    p.mapEmbed = '';
    p.mapLabel = 'Where we are';
  });

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

  /* The partner cards on /pages/partners.html. These are editable from
     Admin → CMS Pages → Partners, so every field here is only the starting
     point — an admin can add, reorder by adding, edit or remove any of them. */
  D.partners = [
    { name: 'Penske',     logo: 'assets/img/brands/penske.png',     type: 'Fleet Operator',   text: 'Nationwide truck leasing and logistics partner across 14 metro service areas.' },
    { name: 'Ryder',      logo: 'assets/img/brands/ryder.png',      type: 'Fleet Operator',   text: 'Scheduled maintenance and roadside coverage for regional distribution fleets.' },
    { name: 'AVIS',       logo: 'assets/img/brands/avis.png',       type: 'Rental Network',   text: 'Overnight branch servicing that protects counter-ready utilisation.' },
    { name: 'Budget',     logo: 'assets/img/brands/budget.png',     type: 'Rental Network',   text: 'Turnaround inspections and damage documentation across metro branches.' },
    { name: 'Enterprise', logo: 'assets/img/brands/enterprise.png', type: 'Rental Network',   text: 'Corporate pool vehicle programmes with consolidated billing.' },
    { name: 'U-Haul',     logo: 'assets/img/brands/uhaul.png',      type: 'Fleet Operator',   text: 'Box truck and trailer service supporting high-cycle rental operations.' }
  ];

  /* A stable id so the editor can address a row after the list is reordered. */
  D.partners.forEach(function (p, i) { p.id = p.id || 'PTR-' + (101 + i); });

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

  /* ======================================================================
     Stripe connection checklist
     Exactly what has to come out of the FleetSquad Stripe account before
     charges, payment links and payouts can be switched from simulated to
     live. Rendered on Admin → Settings.
     ====================================================================== */

  D.stripeSetup = [
    { key: 'publishableKey', label: 'Publishable key', group: 'API keys', required: true,
      placeholder: 'pk_live_…',
      where: 'Stripe Dashboard → Developers → API keys → Publishable key',
      why: 'Loads Stripe.js in the browser so card numbers are typed into a Stripe-hosted field and never touch our server.',
      secret: false },
    { key: 'secretKey', label: 'Secret key', group: 'API keys', required: true,
      placeholder: 'sk_live_…',
      where: 'Stripe Dashboard → Developers → API keys → Secret key (reveal once)',
      why: 'Creates the charge, the payment link and the refund. Server-side only — never paste it anywhere public.',
      secret: true },
    { key: 'webhookSecret', label: 'Webhook signing secret', group: 'API keys', required: true,
      placeholder: 'whsec_…',
      where: 'Stripe Dashboard → Developers → Webhooks → add endpoint → Signing secret',
      why: 'Proves an incoming "payment succeeded" call really came from Stripe before we mark a project paid.',
      secret: true },
    { key: 'accountId', label: 'Stripe account ID', group: 'Account', required: true,
      placeholder: 'acct_…',
      where: 'Stripe Dashboard → Settings → Business → Account details',
      why: 'Identifies which Stripe account the money lands in.',
      secret: false },
    { key: 'currency', label: 'Default currency', group: 'Account', required: true,
      placeholder: 'USD',
      where: 'Stripe Dashboard → Settings → Payments',
      why: 'Every amount is created in this currency.',
      secret: false },
    { key: 'descriptor', label: 'Statement descriptor', group: 'Account', required: true,
      placeholder: 'FLEETSQUAD',
      where: 'Stripe Dashboard → Settings → Public details → Statement descriptor',
      why: 'What the customer sees on their card statement. Keeps chargebacks down.',
      secret: false },
    { key: 'connectClientId', label: 'Connect client ID', group: 'Mechanic payouts', required: false,
      placeholder: 'ca_…',
      where: 'Stripe Dashboard → Connect → Settings → Integration',
      why: 'Only needed if mechanics are to be paid through Stripe Connect rather than outside the platform.',
      secret: false },
    { key: 'taxId', label: 'Business EIN / tax ID', group: 'Mechanic payouts', required: false,
      placeholder: '00-0000000',
      where: 'Your business records — entered once in Stripe',
      why: 'Required by Stripe before payouts to technicians can be enabled.',
      secret: true }
  ];

  /* Everything else the integration needs, but that is configuration rather
     than a credential. Shown as a checklist next to the key fields. */
  D.stripeChecklist = [
    'Turn on the "payment_intent.succeeded", "payment_intent.payment_failed" and "charge.refunded" webhook events.',
    'Point the webhook endpoint at https://fleetsquad.com/api/stripe/webhook once the server is live.',
    'Enable Payment Links in the Stripe dashboard so invoices can be sent from a project.',
    'Add the cards you want to accept (Visa, Mastercard, Amex, Discover) plus ACH if fleets will pay by bank.',
    'Verify the business and add a bank account so Stripe can pay out to FleetSquad.',
    'Keep a test-mode key pair as well — the staging site runs on pk_test / sk_test.'
  ];
  /* ======================================================================
     SEO — the meta sheet supplied by the client
     One entry per page of that document, in its order. This is the single
     source of truth: the runtime setSeo() reads it, and the static <head>
     of every fixed page is generated from it, so the two cannot drift.

     `path` is the production URL the sheet specifies. It drives the
     canonical / og:url. The prototype still serves these pages from their
     .html filenames — the pretty URLs need a rewrite rule at the host.

     `keywords` is the sheet's primary keyword first, then its secondary
     keywords, de-duplicated.
     ====================================================================== */
  D.seo = {
    /* 1 — Home */
    'home': {
      title: 'Mobile Fleet Repair | Diagnosis | Inspections',
      description: 'Mobile fleet maintenance and repair for commercial vehicles. ASE Master Techs come to your location for PM service, diagnostics, inspections and repairs.',
      keywords: 'mobile fleet repair, fleet maintenance services, commercial fleet maintenance, fleet mechanic',
      path: ''
    },

    /* 2-8 — Services */
    'service:preventive-maintenance': {
      title: 'Preventive Fleet Maintenance Services | FleetSquad',
      description: 'Keep your fleet on the road with mobile preventive maintenance. FleetSquad provides scheduled PM service for commercial trucks, vans and fleet vehicles.',
      keywords: 'preventive fleet maintenance, fleet preventive maintenance, fleet PM service, commercial vehicle maintenance, mobile fleet maintenance',
      path: 'preventive-fleet-maintenance/'
    },
    'service:mobile-fleet-repair': {
      title: 'Mobile Fleet Repair Services | FleetSquad',
      description: 'Mobile fleet repair for trucks, vans and commercial vehicles. ASE Master Techs come to your location to diagnose and repair fleet vehicles with less downtime.',
      keywords: 'mobile fleet repair, fleet repair services, mobile fleet mechanic, commercial vehicle repair, onsite fleet repair',
      path: 'mobile-fleet-repair/'
    },
    'service:mobile-diagnostics': {
      title: 'Mobile Fleet Diagnostics & Vehicle Testing | FleetSquad',
      description: 'Professional mobile fleet diagnostics at your location. Find engine, electrical, emissions and drivability problems quickly with advanced diagnostic equipment.',
      keywords: 'mobile fleet diagnostics, fleet vehicle diagnostics, mobile truck diagnostics, commercial vehicle diagnostics, fleet diagnostic service',
      path: 'mobile-fleet-diagnostics/'
    },
    'service:emergency-roadside': {
      title: 'Emergency Fleet Roadside Assistance & Repair | FleetSquad',
      description: 'Get commercial fleet vehicles back on the road with mobile roadside assistance and repair for trucks, vans and company vehicles. Request FleetSquad service.',
      keywords: 'fleet roadside assistance, commercial roadside assistance, fleet roadside service, mobile truck repair, emergency fleet repair',
      path: 'fleet-roadside-assistance/'
    },
    'service:scheduled-maintenance': {
      title: 'Scheduled Fleet Maintenance Services | FleetSquad',
      description: 'Put fleet maintenance on a reliable schedule. FleetSquad handles recurring service, inspections and preventive maintenance at your business or vehicle location.',
      keywords: 'scheduled fleet maintenance, fleet maintenance program, fleet service schedule, commercial fleet maintenance, recurring fleet maintenance',
      path: 'scheduled-fleet-maintenance/'
    },
    'service:mobile-inspections': {
      // The sheet's description runs to 234 characters; Google shows about 160.
      // Kept as written — flagged to the client rather than silently trimmed.
      title: 'Mobile Vehicle Inspection Services | FleetSquad',
      description: 'On-site fleet inspections for commercial trucks, vans and company vehicles. Identify safety, maintenance and repair issues before they cause costly downtime. Mobile same-day DOT inspections and pre-purchase inspections.',
      keywords: 'fleet vehicle inspection, mobile fleet inspections, commercial vehicle inspection, fleet safety inspection, truck inspection service',
      path: 'mobile-inspections/'
    },
    'service:pre-purchase-inspections': {
      title: 'Commercial Fleet Pre-Purchase Inspections | FleetSquad',
      description: 'Buying fleet vehicles? Get professional mobile pre-purchase inspections for commercial trucks, vans and vehicles before adding them to your fleet.',
      keywords: 'fleet pre-purchase inspection, commercial vehicle pre purchase inspection, truck pre purchase inspection, mobile vehicle inspection',
      path: 'fleet-pre-purchase-inspections/'
    },

    /* 9-13 — Vehicle types ("Built FleetSquad Tough") */
    'vehicle:semi-trucks': {
      title: 'Semi-Truck Fleet Maintenance & Mobile Repair | FleetSquad',
      description: 'Mobile semi-truck fleet maintenance and repair at your location. Keep commercial trucks operating with preventive maintenance, diagnostics and inspections.',
      keywords: 'semi truck fleet maintenance, mobile semi truck repair, commercial truck maintenance, fleet truck repair, mobile diesel mechanic',
      path: 'semi-truck-fleet-maintenance/'
    },
    'vehicle:box-trucks': {
      title: 'Box Truck Fleet Maintenance & Mobile Repair | FleetSquad',
      description: "Mobile maintenance and repair for box truck fleets. FleetSquad provides scheduled service, diagnostics, inspections and repairs at your fleet's location.",
      keywords: 'box truck fleet maintenance, box truck repair, mobile box truck repair, commercial truck maintenance, fleet truck service',
      path: 'box-truck-fleet-maintenance/'
    },
    'vehicle:pickup-trucks': {
      title: 'Pickup Truck Fleet Maintenance & Repair | FleetSquad',
      description: 'Mobile fleet maintenance for commercial pickup trucks and work trucks. Get preventive maintenance, diagnostics, inspections and repairs at your location.',
      keywords: 'pickup truck fleet maintenance, work truck fleet maintenance, pickup fleet repair, commercial pickup truck repair',
      path: 'pickup-truck-fleet-maintenance/'
    },
    'vehicle:service-vans': {
      title: 'Service Van Fleet Maintenance & Mobile Repair | FleetSquad',
      description: 'Keep your service van fleet working with mobile maintenance and repair. FleetSquad services commercial vans at your yard, office or vehicle location.',
      keywords: 'van fleet maintenance, service van maintenance, commercial van repair, fleet van repair, mobile van mechanic',
      path: 'service-van-fleet-maintenance/'
    },
    'vehicle:passenger-cars': {
      title: 'Commercial Car Fleet Maintenance & Repair | FleetSquad',
      description: 'Mobile maintenance and repair for company car and passenger vehicle fleets. Reduce downtime with scheduled service, diagnostics and inspections on-site.',
      keywords: 'car fleet maintenance, company vehicle maintenance, passenger fleet maintenance, corporate fleet maintenance, fleet car repair',
      path: 'passenger-car-fleet-maintenance/'
    },

    /* 14-18 — Industries */
    'industry:rental-car-fleets': {
      title: 'Rental Car Fleet Maintenance & Repair Services | FleetSquad',
      description: 'Mobile maintenance and repair for rental car fleets. Keep vehicles rental-ready with scheduled PM service, inspections, diagnostics and on-site repairs.',
      keywords: 'rental car fleet maintenance, rental fleet maintenance, rental car fleet repair, vehicle rental fleet services',
      path: 'rental-car-fleet-maintenance/'
    },
    'industry:trucking-fleets': {
      title: 'Trucking Fleet Maintenance & Mobile Repair | FleetSquad',
      description: 'Fleet maintenance and mobile repair for trucking companies. Reduce downtime with preventive maintenance, diagnostics, inspections and on-site truck service.',
      keywords: 'trucking fleet maintenance, truck fleet maintenance, trucking company maintenance, commercial truck fleet repair',
      path: 'trucking-fleet-repair/'
    },
    'industry:delivery-fleets': {
      title: 'Delivery Fleet Maintenance & Mobile Repair | FleetSquad',
      description: 'Keep delivery vehicles moving with mobile fleet maintenance, inspections, diagnostics and repair services for vans, trucks and commercial delivery fleets.',
      keywords: 'delivery fleet maintenance, delivery vehicle maintenance, delivery van fleet maintenance, last mile fleet maintenance',
      path: 'delivery-fleet-repair/'
    },
    'industry:corporate-fleets': {
      title: 'Corporate Fleet Maintenance Services | FleetSquad',
      description: 'Mobile fleet maintenance for businesses with company vehicles. FleetSquad provides scheduled service, inspections, diagnostics and repairs at your location.',
      keywords: 'corporate fleet maintenance, company fleet maintenance, business fleet services, company vehicle maintenance',
      path: 'corporate-fleet-maintenance/'
    },
    'industry:construction-fleets': {
      title: 'Construction Fleet Maintenance & Mobile Repair | FleetSquad',
      description: 'Mobile maintenance and repair for construction fleet vehicles and work trucks. Reduce downtime with on-site PM service, inspections and diagnostics.',
      keywords: 'construction fleet maintenance, construction truck maintenance, work truck fleet maintenance, construction fleet repair',
      path: 'construction-fleet-maintenance/'
    },

    /* 19-23, 28-30 — Company pages. These also seed the CMS records, so an
       admin can rewrite them from Admin -> CMS Pages. */
    'cms:about': {
      title: 'About FleetSquad | Mobile Fleet Maintenance Experts',
      description: 'Learn about FleetSquad and our mission to keep commercial fleets moving with professional mobile maintenance, diagnostics, inspections and repair services.',
      keywords: 'FleetSquad',
      path: 'about/'
    },
    'cms:service-areas': {
      title: 'Mobile Fleet Maintenance Service Areas | FleetSquad',
      description: 'Explore FleetSquad mobile fleet maintenance and repair service areas. Find professional on-site fleet service for commercial vehicles in your market.',
      keywords: 'mobile fleet maintenance service areas',
      path: 'service-areas/'
    },
    'cms:careers': {
      title: 'Fleet Mechanic Careers & Technician Jobs | FleetSquad',
      description: 'Explore FleetSquad careers for experienced automotive, diesel and fleet technicians. Help commercial fleets stay mission-ready with professional mobile service.',
      keywords: 'fleet mechanic jobs, mobile mechanic jobs, fleet technician jobs, diesel mechanic jobs',
      path: 'careers/'
    },
    'cms:partners': {
      // 190 characters — over the ~160 Google renders. Flagged to the client.
      title: 'Fleet Service Partnerships | FleetSquad',
      description: 'Partner with FleetSquad to deliver scalable mobile maintenance and repair solutions for commercial vehicle fleets and multi-location businesses. We are proud to partner with MobileMechanic.com',
      keywords: 'fleet service partnership',
      path: 'partners/'
    },
    'cms:contact': {
      title: 'Contact FleetSquad | Mobile Fleet Service',
      description: 'Contact FleetSquad for mobile fleet maintenance, repairs, diagnostics, inspections and commercial vehicle service. Request service for your fleet today.',
      keywords: 'mobile fleet service',
      path: 'contact/'
    },
    'cms:faqs': {
      title: 'Fleet Maintenance & Mobile Repair FAQs | FleetSquad',
      description: 'Get answers about mobile fleet maintenance, commercial vehicle repairs, scheduling, inspections, preventive maintenance and FleetSquad service.',
      keywords: 'fleet maintenance FAQ',
      path: 'fleet-maintenance-faq/'
    },
    'cms:privacy': {
      title: 'Privacy Policy | FleetSquad',
      description: 'Read the FleetSquad privacy policy and learn how information is collected, used and protected when using FleetSquad services and websites.',
      keywords: 'privacy policy, fleetsquad privacy',
      path: 'privacy-policy/'
    },
    'cms:terms': {
      title: 'Terms of Service | FleetSquad',
      description: "Review the terms and conditions governing the use of FleetSquad's website, mobile fleet maintenance platform and related services.",
      keywords: 'terms of service, fleetsquad terms',
      path: 'terms-of-service/'
    },

    /* 24 — Get Estimate. Every blue Get Estimate button points here. */
    'estimate': {
      title: 'Get a Mobile Fleet Maintenance & Repair Estimate | FleetSquad',
      description: 'Request a mobile fleet maintenance or repair estimate from FleetSquad. Tell us about your commercial vehicles and service needs to get started. Same-day service available.',
      keywords: 'mobile fleet maintenance estimate, mobile fleet repair quote, fleet maintenance quote, commercial vehicle repair estimate',
      path: 'signup/'
    },

    /* 26 — Portal sign-in. The sheet marks it noindex, which it already is. */
    'login': {
      title: 'Fleet Management Dashboard | FleetSquad',
      description: 'Access your FleetSquad dashboard to review fleet service activity, completed repairs, maintenance history and vehicle service information.',
      keywords: '',
      path: 'fleet-dashboard/',
      noindex: true
    },

    /* 27 — Blog index */
    'blog': {
      title: 'Fleet Maintenance & Repair Blog | FleetSquad',
      description: 'Fleet maintenance tips, commercial vehicle repair information, preventive maintenance guides and fleet management resources from FleetSquad.',
      keywords: 'fleet maintenance blog',
      path: 'blog/'
    }
  };

  /**
   * One entry from the meta sheet.
   * @param {string} key e.g. 'service:mobile-fleet-repair'
   * @returns {{title:string,description:string,keywords:string,path:string}|null}
   */
  D.seoFor = function (key) { return D.seo[key] || null; };

  /* The sheet is also the source for the CMS page records, so what an admin
     opens in Admin -> CMS Pages is what the sheet says. */
  D.cmsPages.forEach(function (p) {
    var entry = D.seo['cms:' + p.slug];
    if (!entry) return;
    p.metaTitle = entry.title;
    p.metaDescription = entry.description;
    p.keywords = entry.keywords;
    p.path = entry.path;
  });

  /* Services, industries and vehicle types are editable in the admin, so each
     record carries its own SEO block rather than looking one up by slug — a
     service an admin adds gets an editable meta record like any other. The
     sheet seeds the ones it lists; anything new starts from the name. */
  function attachSeo(list, kind, fallbackPath) {
    list.forEach(function (item) {
      var entry = D.seo[kind + ':' + item.slug];
      item.seo = entry
        ? { title: entry.title, description: entry.description,
            keywords: entry.keywords, path: entry.path }
        : { title: item.name + ' | FleetSquad',
            description: item.excerpt || '',
            keywords: item.name.toLowerCase(),
            path: fallbackPath + item.slug + '/' };
    });
  }
  attachSeo(D.services, 'service', '');
  attachSeo(D.industries, 'industry', '');
  attachSeo(D.vehicleTypes, 'vehicle', '');
})(window);
