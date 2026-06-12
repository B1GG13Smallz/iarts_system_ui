export type AvailabilityStatus = 'PENDING' | 'AVAILABLE' | 'UNAVAILABLE';

export interface EquipmentAvailabilityRequest {
  id: number;
  requesterName: string;
  referenceNumber: string | null;
  equipment: string;
  rank: string | null;
  description: string | null;
  serialNumber: string | null;
  barCodeNumber: string | null;
  status: AvailabilityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableEquipmentDetails {
  description: string;
  serialNumber: string;
  barCodeNumber: string;
}

export interface RankOption {
  value: string;
  titles: string;
}

export const RANK_OPTIONS: RankOption[] = [
  { value: 'Level 1-2 - Lower skilled', titles: 'Cleaner, General Worker, Groundsman, Messenger' },
  { value: 'Level 3-5 - Skilled', titles: 'Admin Clerk, Registry Clerk, Driver, Secretary, Artisan Assistant' },
  { value: 'Level 6-8 - Highly skilled production', titles: 'Senior Admin Clerk, Admin Officer, Supply Chain Officer, Works Inspector, Artisan, Practitioner' },
  { value: 'Level 9-10 - Highly skilled supervision / junior management', titles: 'Assistant Director, Senior Practitioner, Control Works Inspector, Professional support roles' },
  { value: 'Level 11-12 - Middle Management Service', titles: 'Deputy Director, Senior Specialist, Assistant/Deputy Manager roles' },
  { value: 'Level 13 - Senior Management Service', titles: 'Director' },
  { value: 'Level 14 - Senior Management Service', titles: 'Chief Director' },
  { value: 'Level 15 - Senior Management Service', titles: 'Deputy Director-General' },
  { value: 'Level 16 - Senior Management Service', titles: 'Director-General / Head of Department' },
];
