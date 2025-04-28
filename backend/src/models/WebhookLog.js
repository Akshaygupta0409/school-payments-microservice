import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const webhookLogSchema = new Schema(
  {
    payload: { type: Schema.Types.Mixed, required: true },
    receivedAt: { type: Date, default: Date.now }
  },
  {
    collection: 'webhook_logs'
  }
);

export const WebhookLog = model('WebhookLog', webhookLogSchema);
