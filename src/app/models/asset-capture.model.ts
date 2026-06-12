export interface EquipmentStockItem {
  id: number;
  assetTag: string;
  serialNumber: string | null;
  assetType: string;
  make: string | null;
  model: string | null;
  location: string | null;
  netTrackReference: string | null;
  laptopPolicyRequired: boolean;
  stockRecordId: number | null;
  stockStatus: string;
  storeroomLocation: string | null;
  remarks: string | null;
}

export type EquipmentStockPayload = Omit<EquipmentStockItem, 'id' | 'stockRecordId'>;
