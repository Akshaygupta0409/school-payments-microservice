import Order from '../models/Order.js';
import { OrderStatus } from '../models/OrderStatus.js';
import { NotFoundError } from '../errors/index.js';

// Create a new order
export const createOrder = async (req, res, next) => {
  try {
    const order = new Order({
      ...req.body,
      created_by: req.user.id
    });
    
    const savedOrder = await order.save();
    
    // Create initial order status
    const orderStatus = new OrderStatus({
      order_id: savedOrder._id,
      status: 'pending',
      updated_at: new Date()
    });
    await orderStatus.save();
    
    res.status(201).json(savedOrder);
  } catch (error) {
    next(error);
  }
};

// Get all orders
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('created_by', 'name email')
      .sort({ created_at: -1 });
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Get single order by ID
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('created_by', 'name email');
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Update an order
export const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Delete an order
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Also delete the associated order status
    await OrderStatus.deleteOne({ order_id: req.params.id });
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};
