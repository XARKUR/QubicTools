// Qubic related types

export interface QubicAddress {
  address: string;
  publicKey: string;
  privateKey?: string;
}

export interface QubicBalance {
  address: string;
  balance: number;
  lastUpdate: Date;
}

export interface QubicTransaction {
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface VanityAddressOptions {
  prefix: string;
  caseSensitive: boolean;
  maxAttempts?: number;
}
