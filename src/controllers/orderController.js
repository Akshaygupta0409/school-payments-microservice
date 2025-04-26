import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
  const order = await Order.create(req.body);
  res.status(201).json(order);
};

export const getAllOrders = async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  res.json(order);
};

export const updateOrder = async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  res.json(order);
};

export const deleteOrder = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  res.json({ message: 'Order deleted' });
};
