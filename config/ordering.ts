// All money values here are integer kopecks. Enable only after owner approval.
export type DeliveryZone = {
  id: string;
  name: string;
  enabled: boolean;
  feeMinor: number | null;
  minimumMinor: number | null;
  freeFromMinor: number | null;
  estimate: string | null;
};
export type OrderingConfig = {
  enabled: boolean;
  menuVerified: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  zones: DeliveryZone[];
};
export const ordering: OrderingConfig = {
  enabled: false,
  menuVerified: false,
  pickupEnabled: true,
  deliveryEnabled: false,
  zones: [
    {
      id: 'pending',
      name: 'Умови доставки уточнюються',
      enabled: false,
      feeMinor: null,
      minimumMinor: null,
      freeFromMinor: null,
      estimate: null,
    },
  ],
};
