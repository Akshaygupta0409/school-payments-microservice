import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const orderStatusSchema = new Schema(
  {
    collect_id: { type: Types.ObjectId, ref: 'Order', required: true, index: true },
    order_amount: { type: Number, required: true },
    transaction_amount: { type: Number, required: true },
    payment_mode: { type: String, required: true },
    payment_details: { type: String },
    bank_reference: { type: String },
    payment_message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    error_message: { type: String, default: '' },
    payment_time: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    collection: 'order_statuses'
  }
);

export const OrderStatus = model('OrderStatus', orderStatusSchema);
