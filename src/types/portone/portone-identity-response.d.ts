type PortoneIdentityResponseType = {
  status: string;
  id: string;
  channel: {
    type: string;
    id: string;
    key: string;
    name: string;
    pgProvider: string;
    pgMerchantId: string;
  };
  verifiedCustomer: {
    id: string;
    name: string;
    operator: string;
    phoneNumber: string;
    birthDate: string;
    gender: string;
    isForeigner: boolean;
    ci: string;
    di: string;
  };
  requestedAt: string;
  updatedAt: string;
  statusChangedAt: string;
  verifiedAt: string;
  pgTxId: string;
  pgRawResponse: string;
  version: string;
};
