/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, TransactionLog, Operator, Shop, TransactionType, VideoStatus, TenantStatus } from '../types';

// Helper to generate UUID-like IDs
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Date helpers
const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// SEED DATA
const INITIAL_TENANTS: Tenant[] = [
  {
    company_id: 'CP001',
    company_name: 'Sinar Ritel Utama',
    max_video_quota: 200,
    video_used: 6,
    status: 'ACTIVE',
    created_at: daysAgo(45),
  },
  {
    company_id: 'CP002',
    company_name: 'Gudang Berkah Mandiri',
    max_video_quota: 5, // Low quota to demonstrate enforcement!
    video_used: 5,
    status: 'ACTIVE',
    created_at: daysAgo(30),
  },
  {
    company_id: 'CP003',
    company_name: 'Batik Cantik Nusantara',
    max_video_quota: 50,
    video_used: 1,
    status: 'INACTIVE', // Inactive to demonstrate login restriction or warnings
    created_at: daysAgo(25),
  }
];

const INITIAL_SHOPS: Shop[] = [
  { id: 'SH001', company_id: 'CP001', name: 'Sinar Ritel Tokopedia', marketplace: 'Tokopedia' },
  { id: 'SH002', company_id: 'CP001', name: 'Sinar Ritel Shopee', marketplace: 'Shopee' },
  { id: 'SH003', company_id: 'CP001', name: 'Sinar Ritel Lazada', marketplace: 'Lazada' },
  { id: 'SH004', company_id: 'CP002', name: 'Berkah Mandiri Shopee', marketplace: 'Shopee' },
  { id: 'SH005', company_id: 'CP002', name: 'Berkah Mandiri Tokopedia', marketplace: 'Tokopedia' },
  { id: 'SH006', company_id: 'CP003', name: 'Batik Cantik Official', marketplace: 'Tokopedia' },
];

const INITIAL_OPERATORS: Operator[] = [
  { email: 'budi@sinar.com', company_id: 'CP001', name: 'Budi Santoso', status: 'ACTIVE', created_at: daysAgo(45) },
  { email: 'siti@sinar.com', company_id: 'CP001', name: 'Siti Aminah', status: 'ACTIVE', created_at: daysAgo(40) },
  { email: 'joko@berkah.com', company_id: 'CP002', name: 'Joko Widodo', status: 'ACTIVE', created_at: daysAgo(30) },
  { email: 'rani@cantik.com', company_id: 'CP003', name: 'Rani Wijaya', status: 'ACTIVE', created_at: daysAgo(25) },
];

const INITIAL_LOGS: TransactionLog[] = [
  // CP001 logs (Active, recent)
  {
    transaction_id: 'TX-RECENT-001',
    company_id: 'CP001',
    operator_email: 'budi@sinar.com',
    shop_name: 'Sinar Ritel Tokopedia',
    marketplace: 'Tokopedia',
    tracking_number: 'TKP987654321',
    type: 'ORDER',
    video_drive_id: 'drv_sinar_rec_001',
    video_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop', // mock stream url or a sample video placeholder
    file_size_mb: 4.2,
    status: 'READY',
    created_at: daysAgo(2),
  },
  {
    transaction_id: 'TX-RECENT-002',
    company_id: 'CP001',
    operator_email: 'siti@sinar.com',
    shop_name: 'Sinar Ritel Shopee',
    marketplace: 'Shopee',
    tracking_number: 'SPX502847104',
    type: 'ORDER',
    video_drive_id: 'drv_sinar_rec_002',
    video_url: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?q=80&w=600&auto=format&fit=crop',
    file_size_mb: 6.8,
    status: 'READY',
    created_at: daysAgo(3),
  },
  {
    transaction_id: 'TX-RECENT-003',
    company_id: 'CP001',
    operator_email: 'budi@sinar.com',
    shop_name: 'Sinar Ritel Lazada',
    marketplace: 'Lazada',
    tracking_number: 'LZD009988771',
    type: 'RETURN',
    video_drive_id: 'drv_sinar_rec_003',
    video_url: 'https://images.unsplash.com/photo-1549194388-f61be84a6e9e?q=80&w=600&auto=format&fit=crop',
    file_size_mb: 8.1,
    status: 'READY',
    created_at: daysAgo(1),
  },
  // CP001 logs (Expired - older than 21 days!)
  {
    transaction_id: 'TX-EXPIRED-001',
    company_id: 'CP001',
    operator_email: 'budi@sinar.com',
    shop_name: 'Sinar Ritel Tokopedia',
    marketplace: 'Tokopedia',
    tracking_number: 'TKP112233445',
    type: 'ORDER',
    video_drive_id: 'drv_sinar_exp_001',
    video_url: '',
    file_size_mb: 5.5,
    status: 'READY', // Needs deletion simulation
    created_at: daysAgo(25), // 25 days ago
  },
  {
    transaction_id: 'TX-EXPIRED-002',
    company_id: 'CP001',
    operator_email: 'siti@sinar.com',
    shop_name: 'Sinar Ritel Shopee',
    marketplace: 'Shopee',
    tracking_number: 'SPX998877665',
    type: 'ORDER',
    video_drive_id: 'drv_sinar_exp_002',
    video_url: '',
    file_size_mb: 7.2,
    status: 'READY', // Needs deletion simulation
    created_at: daysAgo(28), // 28 days ago
  },
  {
    transaction_id: 'TX-EXPIRED-003',
    company_id: 'CP001',
    operator_email: 'budi@sinar.com',
    shop_name: 'Sinar Ritel Lazada',
    marketplace: 'Lazada',
    tracking_number: 'LZD554433221',
    type: 'RETURN',
    video_drive_id: 'drv_sinar_exp_003',
    video_url: '',
    file_size_mb: 11.4,
    status: 'READY', // Needs deletion simulation
    created_at: daysAgo(22), // 22 days ago
  },

  // CP002 logs (At full quota)
  {
    transaction_id: 'TX-BERKAH-001',
    company_id: 'CP002',
    operator_email: 'joko@berkah.com',
    shop_name: 'Berkah Mandiri Shopee',
    marketplace: 'Shopee',
    tracking_number: 'SPX223344556',
    type: 'ORDER',
    video_drive_id: 'drv_berkah_001',
    video_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop',
    file_size_mb: 3.1,
    status: 'READY',
    created_at: daysAgo(4),
  },
  {
    transaction_id: 'TX-BERKAH-002',
    company_id: 'CP002',
    operator_email: 'joko@berkah.com',
    shop_name: 'Berkah Mandiri Tokopedia',
    marketplace: 'Tokopedia',
    tracking_number: 'TKP556677889',
    type: 'ORDER',
    video_drive_id: 'drv_berkah_002',
    video_url: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?q=80&w=600&auto=format&fit=crop',
    file_size_mb: 4.0,
    status: 'READY',
    created_at: daysAgo(2),
  },
  {
    transaction_id: 'TX-BERKAH-003',
    company_id: 'CP002',
    operator_email: 'joko@berkah.com',
    shop_name: 'Berkah Mandiri Shopee',
    marketplace: 'Shopee',
    tracking_number: 'SPX121212123',
    type: 'RETURN',
    video_drive_id: 'drv_berkah_003',
    video_url: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?q=80&w=600&auto=format&fit=crop',
    file_size_mb: 5.6,
    status: 'READY',
    created_at: daysAgo(5),
  },
  {
    transaction_id: 'TX-BERKAH-004',
    company_id: 'CP002',
    operator_email: 'joko@berkah.com',
    shop_name: 'Berkah Mandiri Tokopedia',
    marketplace: 'Tokopedia',
    tracking_number: 'TKP454545456',
    type: 'ORDER',
    video_drive_id: 'drv_berkah_004',
    video_url: 'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?q=80&w=600&auto=format&fit=crop',
    file_size_mb: 6.2,
    status: 'READY',
    created_at: daysAgo(6),
  },
  {
    transaction_id: 'TX-BERKAH-005',
    company_id: 'CP002',
    operator_email: 'joko@berkah.com',
    shop_name: 'Berkah Mandiri Shopee',
    marketplace: 'Shopee',
    tracking_number: 'SPX656565654',
    type: 'ORDER',
    video_drive_id: 'drv_berkah_005',
    video_url: 'https://images.unsplash.com/photo-1551829142-dcf45c63ef31?q=80&w=600&auto=format&fit=crop',
    file_size_mb: 5.1,
    status: 'READY',
    created_at: daysAgo(7),
  },

  // CP003 (Inactive company with 1 recent READY video)
  {
    transaction_id: 'TX-CANTIK-001',
    company_id: 'CP003',
    operator_email: 'rani@cantik.com',
    shop_name: 'Batik Cantik Official',
    marketplace: 'Tokopedia',
    tracking_number: 'TKP778899001',
    type: 'ORDER',
    video_drive_id: 'drv_cantik_001',
    video_url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600&auto=format&fit=crop',
    file_size_mb: 4.9,
    status: 'READY',
    created_at: daysAgo(1),
  }
];

// DB KEYS FOR STORAGE
const KEYS = {
  TENANTS: 'jopacking_tenants',
  SHOPS: 'jopacking_shops',
  OPERATORS: 'jopacking_operators',
  LOGS: 'jopacking_logs',
};

// INITIALIZE FUNCTION
export function initializeDB(): void {
  if (!localStorage.getItem(KEYS.TENANTS)) {
    localStorage.setItem(KEYS.TENANTS, JSON.stringify(INITIAL_TENANTS));
  }
  if (!localStorage.getItem(KEYS.SHOPS)) {
    localStorage.setItem(KEYS.SHOPS, JSON.stringify(INITIAL_SHOPS));
  }
  if (!localStorage.getItem(KEYS.OPERATORS)) {
    localStorage.setItem(KEYS.OPERATORS, JSON.stringify(INITIAL_OPERATORS));
  }
  if (!localStorage.getItem(KEYS.LOGS)) {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  }
}

// GETTERS
export function getTenants(): Tenant[] {
  initializeDB();
  return JSON.parse(localStorage.getItem(KEYS.TENANTS) || '[]');
}

export function getShops(): Shop[] {
  initializeDB();
  return JSON.parse(localStorage.getItem(KEYS.SHOPS) || '[]');
}

export function getOperators(): Operator[] {
  initializeDB();
  return JSON.parse(localStorage.getItem(KEYS.OPERATORS) || '[]');
}

export function getLogs(): TransactionLog[] {
  initializeDB();
  return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
}

// MUTATORS WITH CORE BUSINESS RULES
export function saveTenants(tenants: Tenant[]): void {
  localStorage.setItem(KEYS.TENANTS, JSON.stringify(tenants));
}

export function saveShops(shops: Shop[]): void {
  localStorage.setItem(KEYS.SHOPS, JSON.stringify(shops));
}

export function saveOperators(operators: Operator[]): void {
  localStorage.setItem(KEYS.OPERATORS, JSON.stringify(operators));
}

export function saveLogs(logs: TransactionLog[]): void {
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

// --- BR-01: Data Isolation ---
// Filters transaction logs by company_id, preventing leakage
export function getLogsByCompany(companyId: string): TransactionLog[] {
  const allLogs = getLogs();
  return allLogs.filter(log => log.company_id === companyId);
}

// --- BR-04: Quota Enforcement ---
export function checkQuota(companyId: string): { allowed: boolean; used: number; max: number } {
  const tenants = getTenants();
  const tenant = tenants.find(t => t.company_id === companyId);
  if (!tenant) {
    return { allowed: false, used: 0, max: 0 };
  }
  const isAllowed = tenant.video_used < tenant.max_video_quota;
  return {
    allowed: isAllowed,
    used: tenant.video_used,
    max: tenant.max_video_quota
  };
}

// --- ADD NEW TRANSACTION LOG ---
export interface NewTransactionPayload {
  company_id: string;
  operator_email: string;
  shop_name: string;
  marketplace: string;
  tracking_number: string;
  type: TransactionType;
  file_size_mb: number;
}

export function addTransaction(payload: NewTransactionPayload): { success: boolean; error?: string; log?: TransactionLog } {
  const tenants = getTenants();
  const tenantIdx = tenants.findIndex(t => t.company_id === payload.company_id);
  
  if (tenantIdx === -1) {
    return { success: false, error: 'Tenant tidak ditemukan.' };
  }

  const tenant = tenants[tenantIdx];

  // Quota enforcement check (BR-04)
  if (tenant.video_used >= tenant.max_video_quota) {
    return { 
      success: false, 
      error: `Kuota video terlampaui (${tenant.video_used}/${tenant.max_video_quota}). Gagal merekam video baru!` 
    };
  }

  if (tenant.status !== 'ACTIVE') {
    return { success: false, error: 'Status perusahaan tidak aktif (INACTIVE). Silakan hubungi Super Admin.' };
  }

  // Generate log entry
  const transactionId = generateId('TX');
  const driveId = generateId('DRV');
  const newLog: TransactionLog = {
    transaction_id: transactionId,
    company_id: payload.company_id,
    operator_email: payload.operator_email,
    shop_name: payload.shop_name,
    marketplace: payload.marketplace,
    tracking_number: payload.tracking_number,
    type: payload.type,
    video_drive_id: driveId,
    video_url: 'https://images.unsplash.com/photo-1551829142-dcf45c63ef31?q=80&w=600&auto=format&fit=crop', // Placeholder stream
    file_size_mb: parseFloat(payload.file_size_mb.toFixed(2)),
    status: 'READY',
    created_at: new Date().toISOString()
  };

  // Update transaction logs
  const logs = getLogs();
  logs.unshift(newLog); // Put latest at top
  saveLogs(logs);

  // Update tenant's active video counter (realtime)
  tenants[tenantIdx].video_used += 1;
  saveTenants(tenants);

  return { success: true, log: newLog };
}

// --- BR-03: Auto-Delete Policy (Cron Job Simulation) ---
export interface CronReport {
  scanned_count: number;
  deleted_count: number;
  space_freed_mb: number;
  details: {
    transaction_id: string;
    company_id: string;
    company_name: string;
    tracking_number: string;
    age_days: number;
  }[];
}

export function runAutoDeleteCron(): CronReport {
  const logs = getLogs();
  const tenants = getTenants();
  const now = new Date();
  const limitDate = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000); // 21 days ago

  let scannedCount = 0;
  let deletedCount = 0;
  let spaceFreed = 0;
  const details: CronReport['details'] = [];

  const updatedLogs = logs.map(log => {
    if (log.status === 'READY') {
      scannedCount++;
      const createdAt = new Date(log.created_at);
      
      // If older than 21 days
      if (createdAt < limitDate) {
        deletedCount++;
        spaceFreed += log.file_size_mb;
        
        // Find tenant and decrease video_used
        const tenantIdx = tenants.findIndex(t => t.company_id === log.company_id);
        if (tenantIdx !== -1 && tenants[tenantIdx].video_used > 0) {
          tenants[tenantIdx].video_used -= 1;
        }

        const ageDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const tenantName = tenants.find(t => t.company_id === log.company_id)?.company_name || 'Unknown';

        details.push({
          transaction_id: log.transaction_id,
          company_id: log.company_id,
          company_name: tenantName,
          tracking_number: log.tracking_number,
          age_days: ageDays
        });

        // Mutate log status to DELETED, clear drive URL & ID simulation
        return {
          ...log,
          status: 'DELETED' as VideoStatus,
          video_url: '', // Video deleted from Drive
          video_drive_id: 'DELETED_BY_CRON'
        };
      }
    }
    return log;
  });

  if (deletedCount > 0) {
    saveLogs(updatedLogs);
    saveTenants(tenants);
  }

  return {
    scanned_count: scannedCount,
    deleted_count: deletedCount,
    space_freed_mb: parseFloat(spaceFreed.toFixed(2)),
    details
  };
}

// MANAGEMENT FUNCTIONS (For Admins)
export function addTenant(name: string, maxQuota: number): Tenant {
  const tenants = getTenants();
  const newTenant: Tenant = {
    company_id: generateId('CP'),
    company_name: name,
    max_video_quota: maxQuota,
    video_used: 0,
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };
  tenants.push(newTenant);
  saveTenants(tenants);
  return newTenant;
}

export function updateTenantQuota(companyId: string, maxQuota: number): boolean {
  const tenants = getTenants();
  const idx = tenants.findIndex(t => t.company_id === companyId);
  if (idx !== -1) {
    tenants[idx].max_video_quota = maxQuota;
    saveTenants(tenants);
    return true;
  }
  return false;
}

export function updateTenantStatus(companyId: string, status: TenantStatus): boolean {
  const tenants = getTenants();
  const idx = tenants.findIndex(t => t.company_id === companyId);
  if (idx !== -1) {
    tenants[idx].status = status;
    saveTenants(tenants);
    return true;
  }
  return false;
}

export function addOperator(payload: { email: string; name: string; company_id: string }): Operator {
  const operators = getOperators();
  const newOp: Operator = {
    email: payload.email,
    company_id: payload.company_id,
    name: payload.name,
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };
  operators.push(newOp);
  saveOperators(operators);
  return newOp;
}

export function addShop(payload: { name: string; marketplace: string; company_id: string }): Shop {
  const shops = getShops();
  const newShop: Shop = {
    id: generateId('SH'),
    company_id: payload.company_id,
    name: payload.name,
    marketplace: payload.marketplace
  };
  shops.push(newShop);
  saveShops(shops);
  return newShop;
}
