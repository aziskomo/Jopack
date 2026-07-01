/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'ORDER' | 'RETURN';
export type VideoStatus = 'READY' | 'DELETED';
export type TenantStatus = 'ACTIVE' | 'INACTIVE';
export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'OPERATOR';

export interface Tenant {
  company_id: string; // e.g. CP001
  company_name: string;
  max_video_quota: number;
  video_used: number;
  status: TenantStatus;
  created_at: string; // ISO string
}

export interface TransactionLog {
  transaction_id: string;
  company_id: string;
  operator_email: string;
  shop_name: string;
  marketplace: string;
  tracking_number: string;
  type: TransactionType;
  video_drive_id: string;
  video_url: string;
  file_size_mb: number;
  status: VideoStatus;
  created_at: string; // ISO string
}

export interface Operator {
  email: string;
  company_id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Shop {
  id: string;
  company_id: string;
  name: string;
  marketplace: string; // Shopee, Tokopedia, Lazada, TikTok Shop, etc.
}

export interface UserSession {
  role: UserRole;
  email: string;
  company_id: string; // "GLOBAL" for Super Admin
  company_name: string;
  operator_name?: string;
}
