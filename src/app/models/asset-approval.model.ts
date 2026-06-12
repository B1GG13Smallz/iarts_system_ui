export interface AssetApprovalPayload {
  requestId?: number;
  permissionRemovalId?: number;
  movableAssetName: string;
  approvalDate: string;
  signatureFileName: string;
  signatureContentType: string;
  signatureBase64: string;
}
