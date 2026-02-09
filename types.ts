
export type Role = 'admin' | 'client';

export interface WeightEntry {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  waist?: number;
  mood: 'happy' | 'neutral' | 'sad';
  notes?: string;
  photo: string; // Base64 da foto de validação (obrigatória)
}

export type ReferralStatus = 'pending' | 'bought' | 'not_bought';

export interface Referral {
  id: string;
  referrerId: string;
  friendName: string;
  friendContact: string;
  productId: string;
  productName: string;
  rewardValue: number;
  status: ReferralStatus;
  createdAt: string;
  paidAt?: string; // Data do pagamento da comissão
}

export interface Product {
  id: string;
  name: string;
  reward: number;
}

export interface Client {
  id: string;
  name: string;
  password: string;
  startDate: string;
  initialWeight: number;
  targetWeight: number;
  height: number;
  active: boolean;
  adminNotes?: string;
  profileImage?: string;
}

export interface AppState {
  clients: Client[];
  entries: WeightEntry[];
  referrals: Referral[];
  products: Product[];
  currentUser: Client | null;
  isAdmin: boolean;
}
