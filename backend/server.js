const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Donation = require("./models/Donation");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({ message: "FoodBridge API is running!" });
});

// Create a food donation
app.post("/api/donations", async (req, res) => {
  try {
    const {
      foodName,
      quantity,
      unit,
      location,
      latitude,
      longitude,
      availableUntil,
      donorName,
      donorEmail,
      donorPhone,
    } = req.body;

    const donation = await Donation.create({
      foodName,
      quantity,
      unit,
      location,
      latitude,
      longitude,
      availableUntil,
      donorName,
      donorEmail: donorEmail?.toLowerCase().trim(),
      donorPhone,
    });

    res.status(201).json({
      message: "Food donation posted successfully!",
      donation,
    });
  } catch (error) {
  console.error("CREATE DONATION ERROR:", error);

  res.status(400).json({
    message: "Could not create food donation",
    error: error.message,
  });
}
});
// Get donations posted by a specific donor
app.get("/api/donations/mine/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const donations = await Donation.find({
      donorEmail: email,
    }).sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch your donations",
      error: error.message,
    });
  }
});

// Get accepted donations for a specific donor
app.get("/api/donations/responses/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const donations = await Donation.find({
      donorEmail: email,
      status: "CLAIMED",
    }).sort({ updatedAt: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch donation responses",
      error: error.message,
    });
  }
});
// Update an available donation
app.put("/api/donations/:id", async (req, res) => {
  try {
    const {
      foodName,
      quantity,
      unit,
      location,
      latitude,
      longitude,
      availableUntil,
      donorEmail,
    } = req.body;

    if (!donorEmail) {
      return res.status(400).json({
        message: "Donor email is required.",
      });
    }

    const donation = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        donorEmail: donorEmail.toLowerCase().trim(),
        status: "AVAILABLE",
      },
      {
        $set: {
          foodName,
          quantity,
          unit,
          location,
          latitude,
          longitude,
          availableUntil,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!donation) {
      return res.status(404).json({
        message:
          "Donation not found, not owned by you, or already accepted.",
      });
    }

    res.json({
      message: "Donation updated successfully!",
      donation,
    });
  } catch (error) {
    res.status(400).json({
      message: "Could not update donation",
      error: error.message,
    });
  }
});
// Delete an available donation
app.delete("/api/donations/:id", async (req, res) => {
  try {
    const { donorEmail } = req.body;

    if (!donorEmail) {
      return res.status(400).json({
        message: "Donor email is required.",
      });
    }

    const donation = await Donation.findOneAndDelete({
      _id: req.params.id,
      donorEmail: donorEmail.toLowerCase().trim(),
      status: "AVAILABLE",
    });

    if (!donation) {
      return res.status(404).json({
        message:
          "Donation not found, not owned by you, or already accepted.",
      });
    }

    res.json({
      message: "Donation deleted successfully!",
    });
  } catch (error) {
    res.status(400).json({
      message: "Could not delete donation",
      error: error.message,
    });
  }
});

// Get available donations
app.get("/api/donations", async (req, res) => {
  try {
    const donations = await Donation.find({
      status: "AVAILABLE",
    }).sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch donations",
      error: error.message,
    });
  }
});

// Claim food and save receiver details
app.patch("/api/donations/:id/claim", async (req, res) => {
  try {
    const {
      receiverName,
      receiverPhone,
      organization,
      pickupLocation,
    } = req.body;

    // Validate receiver details
    if (
      !receiverName ||
      !receiverPhone ||
      !organization ||
      !pickupLocation
    ) {
      return res.status(400).json({
        message: "Please provide all receiver details.",
      });
    }

    // Validate 10-digit Indian mobile number
    if (!/^[6-9][0-9]{9}$/.test(receiverPhone)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // Claim only if donation is still available
    const donation = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "AVAILABLE",
      },
      {
        status: "CLAIMED",
        receiverName,
        receiverPhone,
        organization,
        pickupLocation,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!donation) {
      return res.status(409).json({
        message: "This donation has already been claimed.",
      });
    }

    res.json({
      message: "Donation claimed successfully!",
      donation,
    });
  } catch (error) {
    console.error("Claim error:", error);

    res.status(400).json({
      message: "Could not claim donation",
      error: error.message,
    });
  }
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`FoodBridge server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });