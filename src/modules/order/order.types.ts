export interface CreateOrderInput {
  restaurant_id: number;
  items: {
    menu_item_id: number;
    quantity:     number;
  }[];
}

export interface UpdateOrderStatusInput {
  status: "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
}