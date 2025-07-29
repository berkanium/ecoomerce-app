const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        price: {
          type: Number,
          default: 0,
          required: true,
          min: 0,
        },
        total: {
          type: Number,
          default: 0,
          required: true,
          min: 0,
        },
      },
    ],
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      state: String,
      phone: String,
    },
    billingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      state: String,
      phone: String,
    },
    payment: {
      method: {
        type: String,
        enum: ["credit_card", "bank_transfer", "cash_on_delivery"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      cost: {
        type: Number,
        default: true,
      },
      method: String,
      estimatedDelivery: Date,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: String,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelledReason: String,
  },
  {
    timestamps: true,
  }
);
//Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
//order-status
orderSchema.index({ status: 1 });
//payment-status
orderSchema.index({ "paymet.status": 1 });

//PRE-SAVE: generate order number
orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    this.orderNumber = `ORD-${timestamp}-${random}`.toUpperCase();
  }
});

//Instance method: order status update

orderSchema.methods.updateStatus = function (newStatus, note = "") {
  ((this.status = newStatus),
    this.statusHistory.push[
      {
        status: newStatus,
        note: note,
        updatedAt: new Date(),
      }
    ]);

  if (newStatus === "delivered") {
    this.deliveredAt = new Date();
  } else if (newStatus == "cancelled") {
    this.cancelledAt = new Date();
  }
};

module.exports = mongoose.model("Order", orderSchema);
