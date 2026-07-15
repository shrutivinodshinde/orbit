import {
  PrismaClient,
  OrderStatus,
  ShipmentStatus,
  CustomsStatus,
  AttendanceStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const prisma = new PrismaClient();
const PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);
const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://localhost:27017/orbit';

// ---------- MONGO SCHEMAS (inline for seed script) ----------

const ActivityLogSchema = new mongoose.Schema(
  {
    companyId: Number,
    userId: Number,
    userName: String,
    action: String,
    entityType: String,
    entityId: Number,
    metadata: mongoose.Schema.Types.Mixed,
    method: String,
    path: String,
  },
  { timestamps: true },
);

const NotificationSchema = new mongoose.Schema(
  {
    companyId: Number,
    userId: Number,
    type: String,
    message: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ChatHistorySchema = new mongoose.Schema(
  {
    userId: Number,
    messages: [
      {
        role: String,
        content: String,
        timestamp: Date,
      },
    ],
  },
  { timestamps: true },
);

// ---------- HELPERS ----------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function checkInTime(date: Date): Date {
  const d = new Date(date);
  d.setHours(randomBetween(8, 10), randomBetween(0, 59), 0, 0);
  return d;
}

function checkOutTime(date: Date): Date {
  const d = new Date(date);
  d.setHours(randomBetween(17, 19), randomBetween(0, 59), 0, 0);
  return d;
}

// ---------- PERMISSIONS + ROLES ----------

const PERMISSIONS = [
  'view_dashboard_global',
  'view_dashboard_country',
  'view_dashboard_branch',
  'view_sales',
  'edit_sales',
  'view_export',
  'edit_export',
  'manage_attendance',
  'view_attendance',
  'manage_users',
  'manage_org_structure',
  'view_audit_logs',
  'use_ai_assistant',
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': [...PERMISSIONS],
  'Country Admin': [
    'view_dashboard_country', 'view_dashboard_branch',
    'view_sales', 'edit_sales', 'view_export', 'edit_export',
    'manage_attendance', 'view_attendance', 'manage_users',
    'manage_org_structure', 'view_audit_logs', 'use_ai_assistant',
  ],
  Manager: [
    'view_dashboard_branch', 'view_sales', 'edit_sales',
    'view_export', 'edit_export', 'manage_attendance',
    'view_attendance', 'use_ai_assistant',
  ],
  'Team Lead': ['view_dashboard_branch', 'view_sales', 'view_export', 'view_attendance', 'use_ai_assistant'],
  Employee: ['view_sales', 'view_export', 'view_attendance'],
  Intern: ['view_sales'],
};

// ---------- REALISTIC PRODUCT CATALOGUE ----------

const PRODUCTS = {
  industrial: [
    { name: 'Industrial Pump A1', unitPrice: 7000 },
    { name: 'Filter Unit Pro', unitPrice: 1200 },
    { name: 'Valve Assembly V3', unitPrice: 3000 },
    { name: 'Pressure Gauge 100PSI', unitPrice: 850 },
    { name: 'Control Panel CP-X', unitPrice: 15000 },
    { name: 'Motor Drive MD-500', unitPrice: 22000 },
    { name: 'Heat Exchanger HE-200', unitPrice: 18000 },
    { name: 'Compressor Unit CU-50', unitPrice: 45000 },
    { name: 'Safety Valve SV-10', unitPrice: 2200 },
    { name: 'Flow Meter FM-Digital', unitPrice: 5500 },
  ],
  precision: [
    { name: 'Precision Gearbox PG-100', unitPrice: 10000 },
    { name: 'CNC Spindle CS-200', unitPrice: 35000 },
    { name: 'Torque Sensor TS-50', unitPrice: 8500 },
    { name: 'Linear Actuator LA-300', unitPrice: 12000 },
    { name: 'Servo Motor SM-750W', unitPrice: 9500 },
    { name: 'Ball Screw Assembly BSA', unitPrice: 6800 },
    { name: 'Rotary Encoder RE-1000', unitPrice: 4200 },
    { name: 'Pneumatic Cylinder PC-80', unitPrice: 3100 },
    { name: 'Hydraulic Seal Kit HSK', unitPrice: 1800 },
    { name: 'Bearing Unit BU-6205', unitPrice: 2400 },
  ],
};

// ---------- MAIN ----------

async function main() {
  console.log('🌱 Starting full realistic seed...\n');

  // ---------- 1. PERMISSIONS ----------
  console.log('📋 Seeding permissions...');
  const permRecords = await Promise.all(
    PERMISSIONS.map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } }),
    ),
  );
  const permMap = new Map(permRecords.map((p) => [p.key, p.id]));

  // ---------- 2. ROLES ----------
  console.log('👥 Seeding roles...');
  const roleRecords = await Promise.all(
    Object.keys(ROLE_PERMISSIONS).map((name) =>
      prisma.role.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const roleMap = new Map(roleRecords.map((r) => [r.name, r.id]));

  // ---------- 3. ROLE PERMISSIONS ----------
  console.log('🔑 Linking role permissions...');
  await Promise.all(
    Object.entries(ROLE_PERMISSIONS).flatMap(([roleName, perms]) => {
      const roleId = roleMap.get(roleName)!;
      return perms.map((key) =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: permMap.get(key)! } },
          update: {},
          create: { roleId, permissionId: permMap.get(key)! },
        }),
      );
    }),
  );

  // ---------- 4. COMPANY ----------
  console.log('🏢 Seeding company...');
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Orbit Industrial Group', activeModules: ['sales', 'export', 'attendance'] },
  });

  // ---------- 5. COUNTRIES ----------
  console.log('🌍 Seeding countries...');
  const [india, germany, uae] = await Promise.all([
    prisma.country.create({ data: { companyId: company.id, name: 'India', code: 'IN' } }),
    prisma.country.create({ data: { companyId: company.id, name: 'Germany', code: 'DE' } }),
    prisma.country.create({ data: { companyId: company.id, name: 'UAE', code: 'AE' } }),
  ]);

  // ---------- 6. BRANCHES ----------
  console.log('🏭 Seeding branches...');
  const [mumbai, delhi, pune, berlin, hamburg, dubai] = await Promise.all([
    prisma.branch.create({ data: { countryId: india.id, name: 'Mumbai Branch', city: 'Mumbai' } }),
    prisma.branch.create({ data: { countryId: india.id, name: 'Delhi Branch', city: 'Delhi' } }),
    prisma.branch.create({ data: { countryId: india.id, name: 'Pune Branch', city: 'Pune' } }),
    prisma.branch.create({ data: { countryId: germany.id, name: 'Berlin Branch', city: 'Berlin' } }),
    prisma.branch.create({ data: { countryId: germany.id, name: 'Hamburg Branch', city: 'Hamburg' } }),
    prisma.branch.create({ data: { countryId: uae.id, name: 'Dubai Branch', city: 'Dubai' } }),
  ]);

  const allBranches = [mumbai, delhi, pune, berlin, hamburg, dubai];

  // ---------- 7. USERS ----------
  console.log('👤 Seeding users (50 total)...');

  const u = (overrides: any) => ({
    companyId: company.id,
    passwordHash: PASSWORD_HASH,
    ...overrides,
  });

  // Fixed named users (for demo login)
  const superAdmin = await prisma.user.create({ data: u({ roleId: roleMap.get('Super Admin'), name: 'Alex Global', email: 'superadmin@orbit.test' }) });
  const indiaAdmin = await prisma.user.create({ data: u({ roleId: roleMap.get('Country Admin'), countryId: india.id, name: 'Priya Sharma', email: 'india.admin@orbit.test' }) });
  const germanyAdmin = await prisma.user.create({ data: u({ roleId: roleMap.get('Country Admin'), countryId: germany.id, name: 'Lukas Becker', email: 'germany.admin@orbit.test' }) });
  const uaeAdmin = await prisma.user.create({ data: u({ roleId: roleMap.get('Country Admin'), countryId: uae.id, name: 'Omar Hassan', email: 'uae.admin@orbit.test' }) });

  // Branch managers
  const mumbaiManager = await prisma.user.create({ data: u({ roleId: roleMap.get('Manager'), countryId: india.id, branchId: mumbai.id, name: 'Rahul Mehta', email: 'mumbai.manager@orbit.test' }) });
  const delhiManager = await prisma.user.create({ data: u({ roleId: roleMap.get('Manager'), countryId: india.id, branchId: delhi.id, name: 'Anita Gupta', email: 'delhi.manager@orbit.test' }) });
  const puneManager = await prisma.user.create({ data: u({ roleId: roleMap.get('Manager'), countryId: india.id, branchId: pune.id, name: 'Vikram Joshi', email: 'pune.manager@orbit.test' }) });
  const berlinManager = await prisma.user.create({ data: u({ roleId: roleMap.get('Manager'), countryId: germany.id, branchId: berlin.id, name: 'Hannah Fischer', email: 'berlin.manager@orbit.test' }) });
  const hamburgManager = await prisma.user.create({ data: u({ roleId: roleMap.get('Manager'), countryId: germany.id, branchId: hamburg.id, name: 'Klaus Weber', email: 'hamburg.manager@orbit.test' }) });
  const dubaiManager = await prisma.user.create({ data: u({ roleId: roleMap.get('Manager'), countryId: uae.id, branchId: dubai.id, name: 'Sara Al Farsi', email: 'dubai.manager@orbit.test' }) });

  // Team leads (one per branch)
  const mumbaiLead = await prisma.user.create({ data: u({ roleId: roleMap.get('Team Lead'), countryId: india.id, branchId: mumbai.id, name: 'Sneha Kapoor', email: 'mumbai.lead@orbit.test' }) });
  const berlinLead = await prisma.user.create({ data: u({ roleId: roleMap.get('Team Lead'), countryId: germany.id, branchId: berlin.id, name: 'Mia Hoffman', email: 'berlin.lead@orbit.test' }) });
  const dubaiLead = await prisma.user.create({ data: u({ roleId: roleMap.get('Team Lead'), countryId: uae.id, branchId: dubai.id, name: 'Khalid Nasser', email: 'dubai.lead@orbit.test' }) });

  // Employees — realistic names per country
  const indianNames = [
    ['Karan Verma', 'karan.v'], ['Neha Patel', 'neha.p'], ['Amit Singh', 'amit.s'],
    ['Pooja Rao', 'pooja.r'], ['Rohan Desai', 'rohan.d'], ['Shreya Iyer', 'shreya.i'],
    ['Arjun Kumar', 'arjun.k'], ['Deepa Nair', 'deepa.n'], ['Sanjay Tiwari', 'sanjay.t'],
    ['Ritu Bose', 'ritu.b'], ['Manish Chandra', 'manish.c'], ['Kavita Shah', 'kavita.s'],
  ];

  const germanNames = [
    ['Felix Müller', 'felix.m'], ['Anna Schneider', 'anna.s'], ['Jan Koch', 'jan.k'],
    ['Sophie Wagner', 'sophie.w'], ['Tobias Bauer', 'tobias.b'], ['Laura Richter', 'laura.r'],
  ];

  const uaeNames = [
    ['Ahmed Al Maktoum', 'ahmed.m'], ['Fatima Al Rashid', 'fatima.r'],
    ['Yousef Ibrahim', 'yousef.i'], ['Layla Hassan', 'layla.h'],
  ];

  const branchEmployeeMap: Record<string, typeof mumbai> = {
    karan: mumbai, neha: mumbai, amit: mumbai, pooja: mumbai,
    rohan: delhi, shreya: delhi, arjun: delhi,
    deepa: pune, sanjay: pune, ritu: pune, manish: pune, kavita: pune,
    felix: berlin, anna: berlin, jan: berlin,
    sophie: hamburg, tobias: hamburg, laura: hamburg,
    ahmed: dubai, fatima: dubai, yousef: dubai, layla: dubai,
  };

  const employees: any[] = [];
  const branchMapping = [mumbai, mumbai, mumbai, mumbai, delhi, delhi, delhi, pune, pune, pune, pune, pune];
  for (let i = 0; i < indianNames.length; i++) {
    const [name, emailPrefix] = indianNames[i];
    const branch = branchMapping[i];
    const emp = await prisma.user.create({
      data: u({ roleId: roleMap.get('Employee'), countryId: india.id, branchId: branch.id, name, email: `${emailPrefix}@orbit.test` }),
    });
    employees.push(emp);
  }

  const germanyBranchMap = [berlin, berlin, berlin, hamburg, hamburg, hamburg];
  for (let i = 0; i < germanNames.length; i++) {
    const [name, emailPrefix] = germanNames[i];
    const branch = germanyBranchMap[i];
    const emp = await prisma.user.create({
      data: u({ roleId: roleMap.get('Employee'), countryId: germany.id, branchId: branch.id, name, email: `${emailPrefix}@orbit.test` }),
    });
    employees.push(emp);
  }

  const uaeBranchMap = [dubai, dubai, dubai, dubai];
  for (let i = 0; i < uaeNames.length; i++) {
    const [name, emailPrefix] = uaeNames[i];
    const emp = await prisma.user.create({
      data: u({ roleId: roleMap.get('Employee'), countryId: uae.id, branchId: uaeBranchMap[i].id, name, email: `${emailPrefix}@orbit.test` }),
    });
    employees.push(emp);
  }

  // Interns (one per major branch)
  const mumbaiIntern = await prisma.user.create({ data: u({ roleId: roleMap.get('Intern'), countryId: india.id, branchId: mumbai.id, name: 'Anika Joshi', email: 'mumbai.intern@orbit.test' }) });
  const berlinIntern = await prisma.user.create({ data: u({ roleId: roleMap.get('Intern'), countryId: germany.id, branchId: berlin.id, name: 'Tim Schulz', email: 'berlin.intern@orbit.test' }) });

  const allUsers = [
    superAdmin, indiaAdmin, germanyAdmin, uaeAdmin,
    mumbaiManager, delhiManager, puneManager, berlinManager, hamburgManager, dubaiManager,
    mumbaiLead, berlinLead, dubaiLead,
    ...employees,
    mumbaiIntern, berlinIntern,
  ];

  console.log(`   ✓ ${allUsers.length} users created`);

  // ---------- 8. CUSTOMERS ----------
  console.log('🤝 Seeding customers...');
  const indianCustomers = await Promise.all([
    prisma.customer.create({ data: { countryId: india.id, name: 'Tata Steel Ltd', email: 'procurement@tatasteel.test', phone: '+91-22-6665-0000' } }),
    prisma.customer.create({ data: { countryId: india.id, name: 'Reliance Industries', email: 'supply@reliance.test', phone: '+91-22-2278-5000' } }),
    prisma.customer.create({ data: { countryId: india.id, name: 'Bharat Petroleum', email: 'orders@bpcl.test', phone: '+91-22-2271-3000' } }),
    prisma.customer.create({ data: { countryId: india.id, name: 'Larsen & Toubro', email: 'purchase@lnt.test', phone: '+91-22-6752-5656' } }),
    prisma.customer.create({ data: { countryId: india.id, name: 'Mahindra Engineering', email: 'vendor@mahindra.test', phone: '+91-20-2720-3000' } }),
    prisma.customer.create({ data: { countryId: india.id, name: 'ONGC India', email: 'supplies@ongc.test', phone: '+91-22-2286-5000' } }),
  ]);

  const germanCustomers = await Promise.all([
    prisma.customer.create({ data: { countryId: germany.id, name: 'Deutsche Handel GmbH', email: 'einkauf@dhgmbh.test', phone: '+49-30-12345-0' } }),
    prisma.customer.create({ data: { countryId: germany.id, name: 'Bayern Maschinenbau AG', email: 'beschaffung@bma.test', phone: '+49-89-98765-0' } }),
    prisma.customer.create({ data: { countryId: germany.id, name: 'Hamburg Technik GmbH', email: 'bestellung@htgmbh.test', phone: '+49-40-55555-0' } }),
    prisma.customer.create({ data: { countryId: germany.id, name: 'Rhein Industrie KG', email: 'einkauf@rheinind.test', phone: '+49-211-44444-0' } }),
  ]);

  const uaeCustomers = await Promise.all([
    prisma.customer.create({ data: { countryId: uae.id, name: 'Emirates Steel Industries', email: 'procurement@emiratessteel.test', phone: '+971-2-555-6000' } }),
    prisma.customer.create({ data: { countryId: uae.id, name: 'ADNOC Distribution', email: 'supply@adnoc.test', phone: '+971-2-606-0606' } }),
    prisma.customer.create({ data: { countryId: uae.id, name: 'Dubai Industrial City', email: 'orders@dic.test', phone: '+971-4-812-8000' } }),
  ]);

  console.log(`   ✓ ${indianCustomers.length + germanCustomers.length + uaeCustomers.length} customers created`);

  // ---------- 9. SALES ORDERS (50 orders) ----------
  console.log('💰 Seeding sales orders (50)...');

  const salesConfigs = [
    // Mumbai — 12 orders
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiLead, products: PRODUCTS.industrial },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiManager, products: PRODUCTS.precision },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiLead, products: PRODUCTS.precision },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiLead, products: PRODUCTS.precision },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiManager, products: PRODUCTS.precision },
    { branch: mumbai, customers: indianCustomers, createdBy: mumbaiLead, products: PRODUCTS.industrial },

    // Delhi — 10 orders
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.precision },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.precision },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.precision },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: delhi, customers: indianCustomers, createdBy: delhiManager, products: PRODUCTS.precision },

    // Pune — 8 orders
    { branch: pune, customers: indianCustomers, createdBy: puneManager, products: PRODUCTS.precision },
    { branch: pune, customers: indianCustomers, createdBy: puneManager, products: PRODUCTS.industrial },
    { branch: pune, customers: indianCustomers, createdBy: puneManager, products: PRODUCTS.precision },
    { branch: pune, customers: indianCustomers, createdBy: puneManager, products: PRODUCTS.industrial },
    { branch: pune, customers: indianCustomers, createdBy: puneManager, products: PRODUCTS.precision },
    { branch: pune, customers: indianCustomers, createdBy: puneManager, products: PRODUCTS.industrial },
    { branch: pune, customers: indianCustomers, createdBy: puneManager, products: PRODUCTS.precision },
    { branch: pune, customers: indianCustomers, createdBy: puneManager, products: PRODUCTS.industrial },

    // Berlin — 10 orders
    { branch: berlin, customers: germanCustomers, createdBy: berlinManager, products: PRODUCTS.precision },
    { branch: berlin, customers: germanCustomers, createdBy: berlinManager, products: PRODUCTS.precision },
    { branch: berlin, customers: germanCustomers, createdBy: berlinLead, products: PRODUCTS.industrial },
    { branch: berlin, customers: germanCustomers, createdBy: berlinManager, products: PRODUCTS.precision },
    { branch: berlin, customers: germanCustomers, createdBy: berlinManager, products: PRODUCTS.precision },
    { branch: berlin, customers: germanCustomers, createdBy: berlinLead, products: PRODUCTS.industrial },
    { branch: berlin, customers: germanCustomers, createdBy: berlinManager, products: PRODUCTS.precision },
    { branch: berlin, customers: germanCustomers, createdBy: berlinManager, products: PRODUCTS.precision },
    { branch: berlin, customers: germanCustomers, createdBy: berlinLead, products: PRODUCTS.industrial },
    { branch: berlin, customers: germanCustomers, createdBy: berlinManager, products: PRODUCTS.precision },

    // Hamburg — 5 orders
    { branch: hamburg, customers: germanCustomers, createdBy: hamburgManager, products: PRODUCTS.industrial },
    { branch: hamburg, customers: germanCustomers, createdBy: hamburgManager, products: PRODUCTS.precision },
    { branch: hamburg, customers: germanCustomers, createdBy: hamburgManager, products: PRODUCTS.industrial },
    { branch: hamburg, customers: germanCustomers, createdBy: hamburgManager, products: PRODUCTS.precision },
    { branch: hamburg, customers: germanCustomers, createdBy: hamburgManager, products: PRODUCTS.industrial },

    // Dubai — 5 orders
    { branch: dubai, customers: uaeCustomers, createdBy: dubaiManager, products: PRODUCTS.industrial },
    { branch: dubai, customers: uaeCustomers, createdBy: dubaiManager, products: PRODUCTS.precision },
    { branch: dubai, customers: uaeCustomers, createdBy: dubaiLead, products: PRODUCTS.industrial },
    { branch: dubai, customers: uaeCustomers, createdBy: dubaiManager, products: PRODUCTS.precision },
    { branch: dubai, customers: uaeCustomers, createdBy: dubaiManager, products: PRODUCTS.industrial },
  ];

  const statusCycle = [
    OrderStatus.COMPLETED, OrderStatus.COMPLETED, OrderStatus.COMPLETED,
    OrderStatus.PENDING, OrderStatus.COMPLETED, OrderStatus.CANCELLED,
    OrderStatus.COMPLETED, OrderStatus.PENDING,
  ];

  const createdOrders = await Promise.all(
    salesConfigs.map((config, idx) => {
      const customer = randomItem(config.customers);
      const numItems = randomBetween(1, 3);
      const items = Array.from({ length: numItems }, () => {
        const product = randomItem(config.products);
        return { productName: product.name, quantity: randomBetween(1, 10), unitPrice: product.unitPrice };
      });
      const amount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const status = statusCycle[idx % statusCycle.length];
      const orderDate = daysAgo(randomBetween(0, 60));

      return prisma.salesOrder.create({
        data: {
          branchId: config.branch.id,
          customerId: customer.id,
          createdById: config.createdBy.id,
          amount,
          status,
          orderDate,
          items: { create: items },
        },
      });
    }),
  );

  console.log(`   ✓ ${createdOrders.length} sales orders created`);

  // ---------- 10. EXPORT SHIPMENTS (25 shipments) ----------
  console.log('🚢 Seeding export shipments (25)...');

  const shipmentConfigs = [
    // India → abroad (15 shipments)
    { branch: mumbai, originCountry: india, destination: 'Germany', createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, originCountry: india, destination: 'UAE', createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, originCountry: india, destination: 'Germany', createdBy: mumbaiLead, products: PRODUCTS.precision },
    { branch: mumbai, originCountry: india, destination: 'United States', createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, originCountry: india, destination: 'UAE', createdBy: mumbaiManager, products: PRODUCTS.precision },
    { branch: delhi, originCountry: india, destination: 'Germany', createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: delhi, originCountry: india, destination: 'United Kingdom', createdBy: delhiManager, products: PRODUCTS.precision },
    { branch: delhi, originCountry: india, destination: 'Japan', createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: pune, originCountry: india, destination: 'UAE', createdBy: puneManager, products: PRODUCTS.precision },
    { branch: pune, originCountry: india, destination: 'Singapore', createdBy: puneManager, products: PRODUCTS.industrial },
    { branch: pune, originCountry: india, destination: 'Germany', createdBy: puneManager, products: PRODUCTS.precision },
    { branch: mumbai, originCountry: india, destination: 'France', createdBy: mumbaiManager, products: PRODUCTS.industrial },
    { branch: mumbai, originCountry: india, destination: 'Canada', createdBy: mumbaiManager, products: PRODUCTS.precision },
    { branch: delhi, originCountry: india, destination: 'Australia', createdBy: delhiManager, products: PRODUCTS.industrial },
    { branch: delhi, originCountry: india, destination: 'UAE', createdBy: delhiManager, products: PRODUCTS.precision },

    // Germany → abroad (7 shipments)
    { branch: berlin, originCountry: germany, destination: 'India', createdBy: berlinManager, products: PRODUCTS.precision },
    { branch: berlin, originCountry: germany, destination: 'UAE', createdBy: berlinManager, products: PRODUCTS.precision },
    { branch: berlin, originCountry: germany, destination: 'United States', createdBy: berlinLead, products: PRODUCTS.precision },
    { branch: hamburg, originCountry: germany, destination: 'India', createdBy: hamburgManager, products: PRODUCTS.industrial },
    { branch: hamburg, originCountry: germany, destination: 'China', createdBy: hamburgManager, products: PRODUCTS.precision },
    { branch: hamburg, originCountry: germany, destination: 'Brazil', createdBy: hamburgManager, products: PRODUCTS.industrial },
    { branch: berlin, originCountry: germany, destination: 'Japan', createdBy: berlinManager, products: PRODUCTS.precision },

    // UAE → abroad (3 shipments)
    { branch: dubai, originCountry: uae, destination: 'India', createdBy: dubaiManager, products: PRODUCTS.industrial },
    { branch: dubai, originCountry: uae, destination: 'Germany', createdBy: dubaiLead, products: PRODUCTS.precision },
    { branch: dubai, originCountry: uae, destination: 'United Kingdom', createdBy: dubaiManager, products: PRODUCTS.industrial },
  ];

  const shipmentStatusCycle: [ShipmentStatus, CustomsStatus][] = [
    [ShipmentStatus.DELIVERED, CustomsStatus.CLEARED],
    [ShipmentStatus.DELIVERED, CustomsStatus.CLEARED],
    [ShipmentStatus.IN_CUSTOMS, CustomsStatus.HELD],
    [ShipmentStatus.SHIPPED, CustomsStatus.PENDING],
    [ShipmentStatus.IN_CUSTOMS, CustomsStatus.CLEARED],
    [ShipmentStatus.PACKED, CustomsStatus.PENDING],
    [ShipmentStatus.DELIVERED, CustomsStatus.CLEARED],
    [ShipmentStatus.SHIPPED, CustomsStatus.PENDING],
  ];

  const createdShipments = await Promise.all(
    shipmentConfigs.map((config, idx) => {
      const [status, customsStatus] = shipmentStatusCycle[idx % shipmentStatusCycle.length];
      const numItems = randomBetween(1, 3);
      const items = Array.from({ length: numItems }, () => {
        const product = randomItem(config.products);
        return { productName: product.name, quantity: randomBetween(2, 20), value: product.unitPrice * randomBetween(2, 20) };
      });
      const shipmentDate = daysAgo(randomBetween(5, 45));
      const expectedDeliveryDate = new Date(shipmentDate);
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + randomBetween(7, 21));

      return prisma.exportShipment.create({
        data: {
          branchId: config.branch.id,
          originCountryId: config.originCountry.id,
          destinationCountry: config.destination,
          createdById: config.createdBy.id,
          status,
          customsStatus,
          shipmentDate,
          expectedDeliveryDate,
          items: { create: items },
        },
      });
    }),
  );

  console.log(`   ✓ ${createdShipments.length} export shipments created`);

  // ---------- 11. ATTENDANCE (30 days × all users) ----------
  console.log('📅 Seeding attendance (30 days × all field users)...');

  const fieldUsers = [
    mumbaiManager, delhiManager, puneManager, berlinManager, hamburgManager, dubaiManager,
    mumbaiLead, berlinLead, dubaiLead,
    ...employees,
    mumbaiIntern, berlinIntern,
  ];

  const attendanceRecords: any[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let daysBack = 0; daysBack < 30; daysBack++) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysBack);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const user of fieldUsers) {
      let status: AttendanceStatus;
      const rand = Math.random();

      if (isWeekend) {
        // Skip weekends — no attendance record (realistic)
        continue;
      } else if (rand < 0.75) {
        status = AttendanceStatus.PRESENT;
      } else if (rand < 0.88) {
        status = AttendanceStatus.ABSENT;
      } else {
        status = AttendanceStatus.LEAVE;
      }

      const checkIn = status === AttendanceStatus.PRESENT ? checkInTime(date) : null;
      const checkOut = status === AttendanceStatus.PRESENT ? checkOutTime(date) : null;

      attendanceRecords.push({
        userId: user.id,
        date,
        status,
        checkIn,
        checkOut,
      });
    }
  }

  // createMany is much faster than individual creates for bulk attendance
  await prisma.attendance.createMany({ data: attendanceRecords });
  console.log(`   ✓ ${attendanceRecords.length} attendance records created`);

  // ---------- 12. MONGODB DATA ----------
  console.log('\n🍃 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URL);

  const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
  const Notification = mongoose.model('Notification', NotificationSchema);
  const ChatHistory = mongoose.model('ChatHistory', ChatHistorySchema);

  // Clear existing collections
  await Promise.all([
    ActivityLog.deleteMany({}),
    Notification.deleteMany({}),
    ChatHistory.deleteMany({}),
  ]);

  // ---------- 12a. ACTIVITY LOGS (50 entries) ----------
  console.log('📝 Seeding activity logs (50)...');

  const auditActions = [
    { action: 'sales.post', entityType: 'Sales', method: 'POST', path: '/sales' },
    { action: 'sales.patch', entityType: 'Sales', method: 'PATCH', path: '/sales/:id/status' },
    { action: 'export.post', entityType: 'Export', method: 'POST', path: '/export' },
    { action: 'export.patch', entityType: 'Export', method: 'PATCH', path: '/export/:id/status' },
    { action: 'attendance.post', entityType: 'Attendance', method: 'POST', path: '/attendance/check-in' },
    { action: 'attendance.post', entityType: 'Attendance', method: 'POST', path: '/attendance/check-out' },
    { action: 'users.patch', entityType: 'Users', method: 'PATCH', path: '/users/:id' },
    { action: 'users.post', entityType: 'Users', method: 'POST', path: '/users/:id/permissions' },
  ];

  const auditUsers = [
    { id: superAdmin.id, email: superAdmin.email },
    { id: indiaAdmin.id, email: indiaAdmin.email },
    { id: mumbaiManager.id, email: mumbaiManager.email },
    { id: berlinManager.id, email: berlinManager.email },
    { id: dubaiManager.id, email: dubaiManager.email },
    { id: mumbaiLead.id, email: mumbaiLead.email },
  ];

  const activityLogs = Array.from({ length: 50 }, (_, i) => {
    const action = randomItem(auditActions);
    const user = randomItem(auditUsers);
    const entityId = randomBetween(1, 25);
    return {
      companyId: company.id,
      userId: user.id,
      userName: user.email,
      action: action.action,
      entityType: action.entityType,
      entityId,
      method: action.method,
      path: action.path.replace(':id', String(entityId)),
      metadata: { ip: `192.168.1.${randomBetween(1, 50)}`, userAgent: 'Mozilla/5.0' },
      createdAt: daysAgo(randomBetween(0, 29)),
    };
  });

  await ActivityLog.insertMany(activityLogs);
  console.log(`   ✓ ${activityLogs.length} audit log entries created`);

  // ---------- 12b. NOTIFICATIONS (30 entries) ----------
  console.log('🔔 Seeding notifications (30)...');

  const notificationTemplates = [
    (branch: string) => ({ type: 'customs_delay', message: `Shipment from ${branch} is held at customs. Action required.` }),
    (branch: string) => ({ type: 'order_completed', message: `Sales order from ${branch} branch has been completed.` }),
    (branch: string) => ({ type: 'new_shipment', message: `New export shipment created from ${branch} branch.` }),
    (branch: string) => ({ type: 'attendance_alert', message: `High absence rate detected in ${branch} branch this week.` }),
    (branch: string) => ({ type: 'order_cancelled', message: `A sales order from ${branch} was cancelled. Review required.` }),
    (branch: string) => ({ type: 'customs_cleared', message: `Shipment from ${branch} cleared customs successfully.` }),
  ];

  const notificationTargets = [
    { userId: superAdmin.id, branch: 'Mumbai' },
    { userId: superAdmin.id, branch: 'Berlin' },
    { userId: indiaAdmin.id, branch: 'Delhi' },
    { userId: indiaAdmin.id, branch: 'Pune' },
    { userId: germanyAdmin.id, branch: 'Hamburg' },
    { userId: mumbaiManager.id, branch: 'Mumbai' },
    { userId: berlinManager.id, branch: 'Berlin' },
    { userId: dubaiManager.id, branch: 'Dubai' },
    { userId: superAdmin.id, branch: 'Dubai' },
    { userId: uaeAdmin.id, branch: 'Dubai' },
  ];

  const notifications = Array.from({ length: 30 }, (_, i) => {
    const target = randomItem(notificationTargets);
    const template = randomItem(notificationTemplates);
    const { type, message } = template(target.branch);
    return {
      companyId: company.id,
      userId: target.userId,
      type,
      message,
      read: Math.random() > 0.4, // 60% unread
      createdAt: daysAgo(randomBetween(0, 14)),
    };
  });

  await Notification.insertMany(notifications);
  console.log(`   ✓ ${notifications.length} notifications created`);

  // ---------- 12c. AI CHAT HISTORIES (5 users with history) ----------
  console.log('🤖 Seeding AI chat histories (5 users)...');

  const chatHistories = [
    {
      userId: superAdmin.id,
      messages: [
        { role: 'user', content: 'What is our total revenue across all countries?', timestamp: daysAgo(3) },
        { role: 'assistant', content: 'Based on your completed sales orders across all branches, your total revenue is ₹8,45,000. Mumbai branch leads with ₹3,20,000, followed by Berlin at ₹2,80,000, Delhi at ₹1,25,000, Pune at ₹70,000, Hamburg at ₹35,000, and Dubai at ₹15,000.', timestamp: daysAgo(3) },
        { role: 'user', content: 'Which branch has the most pending orders?', timestamp: daysAgo(3) },
        { role: 'assistant', content: 'Mumbai branch currently has the highest number of pending orders at 4, followed by Delhi with 3 and Berlin with 2. I recommend following up with the Mumbai team on these open orders.', timestamp: daysAgo(3) },
      ],
    },
    {
      userId: indiaAdmin.id,
      messages: [
        { role: 'user', content: 'Are there any shipments from India stuck in customs?', timestamp: daysAgo(1) },
        { role: 'assistant', content: 'Yes, there is currently 1 shipment from the Mumbai branch to Germany that has a customs status of HELD. The shipment contains Industrial Pump A1 units and has been flagged since 5 days ago. I recommend contacting your freight forwarder immediately.', timestamp: daysAgo(1) },
        { role: 'user', content: 'How many employees were present today in India?', timestamp: daysAgo(1) },
        { role: 'assistant', content: 'Across all Indian branches today, 18 out of 22 employees are marked as PRESENT. 2 employees are on leave and 2 are absent. Breakdown: Mumbai 8/10, Delhi 6/7, Pune 4/5.', timestamp: daysAgo(1) },
      ],
    },
    {
      userId: mumbaiManager.id,
      messages: [
        { role: 'user', content: 'What is my branch total completed revenue?', timestamp: daysAgo(5) },
        { role: 'assistant', content: 'Mumbai branch has completed sales orders totalling ₹3,20,000 across 8 completed orders. Your average order value is ₹40,000. The top customer this period is Tata Steel Ltd with 3 orders.', timestamp: daysAgo(5) },
      ],
    },
    {
      userId: berlinManager.id,
      messages: [
        { role: 'user', content: 'Show me all export shipments from Berlin', timestamp: daysAgo(2) },
        { role: 'assistant', content: 'Berlin branch has 4 active export shipments: 1 delivered to India (CLEARED), 1 shipped to UAE (PENDING customs), 1 in customs for United States (HELD — needs attention), and 1 packed for Japan (awaiting pickup).', timestamp: daysAgo(2) },
      ],
    },
    {
      userId: dubaiManager.id,
      messages: [
        { role: 'user', content: 'Compare our sales vs export performance', timestamp: daysAgo(7) },
        { role: 'assistant', content: 'Dubai branch sales total ₹1,50,000 across 5 orders. On the export side, you have 3 shipments with a combined value of ₹2,80,000 exported. Your export value exceeds domestic sales, which is typical for a trading hub branch. 2 of 3 shipments are delivered or cleared.', timestamp: daysAgo(7) },
      ],
    },
  ];

  await ChatHistory.insertMany(chatHistories);
  console.log(`   ✓ ${chatHistories.length} AI chat histories created`);

  await mongoose.disconnect();

  // ---------- SUMMARY ----------
  console.log('\n✅ Seed complete! Summary:');
  console.log('');
  console.log('PostgreSQL (Neon):');
  console.log(`  • 1 company, 3 countries, 6 branches`);
  console.log(`  • ${allUsers.length} users across all roles`);
  console.log(`  • ${indianCustomers.length + germanCustomers.length + uaeCustomers.length} customers`);
  console.log(`  • ${createdOrders.length} sales orders with items`);
  console.log(`  • ${createdShipments.length} export shipments with items`);
  console.log(`  • ${attendanceRecords.length} attendance records (30 days)`);
  console.log('');
  console.log('MongoDB (Atlas):');
  console.log(`  • 50 activity log entries`);
  console.log(`  • 30 notifications`);
  console.log(`  • 5 AI chat histories`);
  console.log('');
  console.log('Demo logins (password: Password123!):');
  console.log('  superadmin@orbit.test    → Super Admin (all countries)');
  console.log('  india.admin@orbit.test   → Country Admin (India)');
  console.log('  germany.admin@orbit.test → Country Admin (Germany)');
  console.log('  uae.admin@orbit.test     → Country Admin (UAE)');
  console.log('  mumbai.manager@orbit.test → Manager (Mumbai branch)');
  console.log('  berlin.manager@orbit.test → Manager (Berlin branch)');
  console.log('  mumbai.intern@orbit.test  → Intern (Mumbai branch)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());