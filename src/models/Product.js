const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      maxlength: [100, "Name must be at most 100 characters."],
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
      maxlength: [20000, "Description must be at most 100 characters."],
    },

    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price isn't letter than 0."],
    },

    discountPrice: {
      type: Number,
      required: [true, "Discount price is required."],
      min: [0, "Discount price isn't letter than 0."],
      validate: function (value) {
        return !value || value < this.price;
      },
      message: "Discount price is letter the price.",
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Product brand is required."],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "Sku is required."],
      trim: true,
      unique: true,
      uppercase: true,
    },
    stock: {
      type: Number,
      required: [true, "Stock is required."],
      trim: true,
      min: [0, "Stock isn't letter than 0."],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { String },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    tags: [String],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    featured: { type: Boolean, default: true },
    weight: Number,
    dimensions: {
      length: Number,
      widht: Number,
      height: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Virtual fields.
productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice || this.price;
});

productSchema.virtual(discountPercentage).get(function () {
  if (!this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

//Indexes for product collection.
productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: -1, createdAt: -1 });
productSchema.index({ sku: 1 }, { unique: true });

//Static method: Searh
productSchema.statics.search = function (query, options = {}) {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    sort = { createdAt: -1 },
    page = 1,
    limit = 12,
  } = options;

  const filter = { isActive: true };
  if (query) {
    filter.$text = { $search: query };
  }

  if (category) {
    filter.category = category;
  }
  if (brand) {
    filter.brand = brand;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = minPrice;
    if (maxPrice) filter.price.$lte = maxPrice;
  }

  return this.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model("Product", productSchema);
