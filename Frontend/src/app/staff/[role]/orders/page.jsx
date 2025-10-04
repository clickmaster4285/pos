import OrdersClient from '@/components/orders/orders-client';

export const metadata = {
  title: 'Orders | YK Automotive',
  description: 'Create, view, update, and delete automotive service orders.',
};

export default function OrdersPage() {
  return <OrdersClient />;
}
