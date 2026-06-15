import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes: string;
}

export interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: number;
}

interface OrderStore {
  orders: Order[];
  addOrder: (table: string, items: OrderItem[]) => Order;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  removeOrder: (id: string) => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (table, items) => {
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const order: Order = {
          id: 'ORD-' + Date.now().toString(36).toUpperCase(),
          table,
          items,
          total,
          status: 'pending',
          createdAt: Date.now(),
        };
        set((state) => ({ orders: [...state.orders, order] }));
        return order;
      },
      updateOrderStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status } : o
          ),
        })),
      removeOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        })),
    }),
    { name: 'restrodyn-orders' }
  )
);
