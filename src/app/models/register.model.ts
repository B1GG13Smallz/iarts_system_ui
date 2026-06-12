export type RegisterType =
  | 'Permanent Issuing Equipment Register'
  | 'Loaning of ICT Equipment Register'
  | 'Loaning Technicians Set-up Register'
  | 'Unit Storage Register';

export interface RegisterSignaturePayload {
  fileName: string;
  contentType: string;
  base64: string;
}

export interface RegisterPayload {
  registerType: RegisterType;
  dateOut: string;
  itemDescription: string;
  serialNumber: string;
  barCode: string;
  orderNumber: string;
  userFullName: string;
  extension: string;
  roomNumber: string;
  userSignOut?: RegisterSignaturePayload;
  storesOfficialName: string;
  storesOfficialSignOut?: RegisterSignaturePayload;
  comment: string;
}

export interface RegisterRecord extends RegisterPayload {
  id: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoresOfficialSignaturePayload {
  storesOfficialName: string;
  storesOfficialSignOut: RegisterSignaturePayload;
}
