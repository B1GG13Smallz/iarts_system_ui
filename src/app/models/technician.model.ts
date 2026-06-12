export interface TechnicianRequestDetails {
  request: {
    id: number;
    referenceNumber: string;
    itpNumber: string;
    orderNumber: string;
    chiefDirectorate: string;
    subDirectorate: string;
    objective: string;
    responsibility: string;
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
    status: string;
  };
  availabilityStatus: string;
  equipment: string;
  equipmentDescription: string;
  serialNumber: string;
  barCodeNumber: string;
  source?: 'INTRA' | 'AVAILABILITY';
}

export type TechnicianRequestStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'READY_FOR_DELIVERY' | 'COMPLETED';
