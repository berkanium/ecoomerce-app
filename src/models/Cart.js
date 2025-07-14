const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sessionId: {
      type: String,
      required: function () {
        return !this.user; //if doesn't have user, session Id is required.
      },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Product quantity is must be grather then equal 1"],
          default: 1,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

//Indexes
cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
cartSchema.index({ lastUpdated: 1 });

//Pre-Save: Calculate Total Amount
cartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  this.totalAmount = this.items.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );
});

//Instance Method: Added cart
cartSchema.method.addItem = function (productId, quantity, price) {
  const existingItem = this.items.find(
    (item) => item.product.toString() == productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity: quantity,
      price: price,
    });
  }
};

//Instance Method: update cart
cartSchema.method.updateItem = function (productId, quantity) {
  const item = this.items.find(
    (item) => item.product.toString() == productId.toString()
  );

  if (item) {
    if (quantity <= 0) {
      this.items = this.items.filter(
        item.product.toString() !== productId.toString()
      );
    } else {
      item.quantity += quantity;
    }
  }
};

//Instance method: removed item
cartSchema.method.updateItem = function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
};

module.exports = mongoose.model("Cart", cartSchema);
