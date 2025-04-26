import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const studentInfoSchema = new Schema(
  {
    name: { type: String, required: true },
    id: { type: String, required: true },
    email: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  {
    _id: false
  }
);

const orderSchema = new Schema(
  {
    school_id: { type: Types.ObjectId, required: true, index: true },
    trustee_id: { type: Types.ObjectId, required: true },
    student_info: { type: studentInfoSchema, required: true },
    gateway_name: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
  },
  {
    timestamps: true,
    collection: 'orders'
  }
);

export default model('Order', orderSchema);
