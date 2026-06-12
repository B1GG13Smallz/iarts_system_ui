export interface IntraRequestPayload {
  referenceNumber: string;
  itpNumber: string;
  orderNumber: string;
  chiefDirectorate: string;
  subDirectorate: string;
  objective: string;
  responsibility: string;
  rank: string;
  chiefUser: string;
  callReference: string;
  currentOwner: string;
  currentBuilding: string;
  currentFloor: string;
  currentOffice: string;
  currentRegion: string;
  currentContact: string;
  destinationOwner: string;
  destinationBuilding: string;
  destinationFloor: string;
  destinationOffice: string;
  destinationRegion: string;
  destinationContact: string;
  movementReason: string;
  destinationSignatureDate?: string;
  destinationSignatureFileName?: string;
  destinationSignatureContentType?: string;
  destinationSignatureBase64?: string;
}

export interface IntraRequestRecord extends IntraRequestPayload {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  destinationSignatureCaptured?: boolean;
  assetApprovalDate?: string;
  assetApprovalSignatureFileName?: string;
  assetApprovalSignatureContentType?: string;
  assetApprovalSignatureCaptured?: boolean;
}
