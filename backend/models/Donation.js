const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    foodName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unit: {
      type: String,
      default: "meals",
    },

    location: {
      type: String,
      required: true,
    },

    latitude: {
  type: Number,
  default: null,
},

longitude: {
  type: Number,
  default: null,
},

    availableUntil: {
      type: Date,
      required: true,
    },

    donorName: {
      type: String,
      required: true,
    },
    donorEmail: {
  type: String,
  required: true,
  lowercase: true,
  trim: true,
},
    donorPhone: {
  type: String,
  required: true,
  match: /^[6-9]\d{9}$/,
},
    receiverName: {
  type: String,
  default: "",
},

receiverPhone: {
  type: String,
  default: "",
},

organization: {
  type: String,
  default: "",
},

pickupLocation: {
  type: String,
  default: "",
},

    status: {
      type: String,
      enum: ["AVAILABLE", "CLAIMED", "PICKED_UP", "DELIVERED", "CANCELLED"],
      default: "AVAILABLE",
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);