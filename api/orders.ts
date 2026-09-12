import { handleOrders } from '../server/orders-handler';

/** Vercel's Web runtime invokes the default exported handler for each request. */
export default function orders(request: Request): Promise<Response> {
  return handleOrders(request);
}
