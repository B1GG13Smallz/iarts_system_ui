export interface PermissionSignaturePayload {
  fileName: string;
  contentType: string;
  base64: string;
}

export interface PermissionToRemoveEquipmentPayload {
  officialName: string;
  unitDirectorateBranch: string;
  telephoneNumber: string;
  identityOrPersalNumber: string;
  removalReason: string;
  officialSignature?: PermissionSignaturePayload;
  equipmentDescription: string;
  barCode: string;
  serialNumber: string;
  currentLocation: string;
  period: string;
  newLocation: string;
  ictSignature?: PermissionSignaturePayload;
  ictDate: string;
  mamSignature?: PermissionSignaturePayload;
  mamDate: string;
  securitySignature?: PermissionSignaturePayload;
  securityDate: string;
}

export interface PermissionRemovalRecord extends PermissionToRemoveEquipmentPayload {
  id: number;
  workflowStatus: string;
  createdByUsername: string;
}
