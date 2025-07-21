const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionCode: {
      type: String,
      required: true,
    },
    transactionUUID: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    signedFieldNames: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
