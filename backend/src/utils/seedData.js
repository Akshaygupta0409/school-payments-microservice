import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Order from '../models/Order.js';
import { OrderStatus } from '../models/OrderStatus.js';

dotenv.config();

// Connect to MongoDB
connectDB();

// Sample data for Orders
const orderSamples = [
  {
    school_id: '65b0e6293e9f76a9694d84b4',
    trustee_id: 'trustee123',
    student_info: {
      name: 'John Doe',
      id: 'STU001',
      email: 'john@example.com'
    },
    gateway_name: 'Edviron',
    amount: 5000,
    currency: 'INR',
    status: 'completed'
  },
  {
    school_id: '65b0e6293e9f76a9694d84b4',
    trustee_id: 'trustee123',
    student_info: {
      name: 'Jane Smith',
      id: 'STU002',
      email: 'jane@example.com'
    },
    gateway_name: 'Edviron',
    amount: 7500,
    currency: 'INR',
    status: 'pending'
  },
  {
    school_id: '65b0e6293e9f76a9694d84b4',
    trustee_id: 'trustee123',
    student_info: {
      name: 'Bob Johnson',
      id: 'STU003',
      email: 'bob@example.com'
    },
    gateway_name: 'Edviron',
    amount: 6000,
    currency: 'INR',
    status: 'failed'
  }
];

// Function to seed data
const seedData = async () => {
  try {
    // Clear existing data
    await Order.deleteMany({});
    await OrderStatus.deleteMany({});
    
    console.log('Existing data cleared');
    
    // Insert sample orders
    const insertedOrders = await Order.insertMany(orderSamples);
    console.log(`${insertedOrders.length} orders inserted`);
    
    // Create order statuses for each order
    const orderStatusSamples = insertedOrders.map((order, index) => ({
      collect_id: `COLL${index + 100}`,
      order_id: order._id,
      order_amount: order.amount,
      transaction_amount: order.amount + (index * 100),
      payment_mode: ['upi', 'card', 'netbanking'][index % 3],
      payment_details: `payment details ${index}`,
      bank_reference: `REF${index}`,
      payment_message: `Payment ${['Success', 'Pending', 'Failed'][index % 3]}`,
      status: ['Success', 'Pending', 'Failed'][index % 3],
      error_message: index % 3 === 2 ? 'Transaction failed' : '',
      payment_time: new Date(Date.now() - index * 86400000) // Different days
    }));
    
    const insertedOrderStatuses = await OrderStatus.insertMany(orderStatusSamples);
    console.log(`${insertedOrderStatuses.length} order statuses inserted`);
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Run the seed function
seedData();
