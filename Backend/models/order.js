const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    houseNumber: {
      type: String,
      required: true,
    },
    streetName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    zone: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    orderItems: {
      type: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: "BeautyProduct",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
        },
      ],
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
    },
    paid: {
      type: Boolean,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    statusDetails: {
      paymentMade: {
        date: {
          type: Date,
          default: Date.now,
        },
        value: {
          type: Boolean,
          default: false,
        },
      },
      processing: {
        date: {
          type: Date,
          default: Date.now,
        },
        value: {
          type: Boolean,
          default: false,
        },
      },
      shipped: {
        date: {
          type: Date,
          default: Date.now,
        },
        value: {
          type: Boolean,
          default: false,
        },
      },
      delivered: {
        date: {
          type: Date,
          default: Date.now,
        },
        value: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);

const OrderStatus = {
  CANCELLED: -1,
  PLACED: 0,
  PAYMENT_MADE: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};
