import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";

import data from "./data/data.json";
import { authenticate } from "./middlewares/auth.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const port = process.env.PORT || 8080;
const app = express();

// MIDDLEWARES //
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

// MONGO DB CONNECTION //
const mongoUrl = process.env.MONGO_URL;
mongoose.connect(mongoUrl);
mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));

// SCHEMA //
const thoughtSchema = new mongoose.Schema({
  message: { type: String, required: true, minlength: 3 },
  hearts: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  category: { type: String, default: "General" },
  createdAt: { type: Date, default: Date.now },
});

const Thought = mongoose.model("Thought", thoughtSchema);

// API DOCUMENTATION //
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);
  res.json({
    message: "Welcome to the Happy Thoughts API",
    endpoints: endpoints,
  });
});

// GET ALL THOUGHTS
app.get("/thoughts", async (req, res) => {
  const { category, sortBy, page = 1, limit = 10 } = req.query;

  try {
    let thoughts = await Thought.find();

    // Filter by category
    if (category) {
      thoughts = thoughts.filter(
        (item) => item.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Sort by date
    if (sortBy === "date") {
      thoughts = thoughts.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const end = start + +limit;
    const paginatedThoughts = thoughts.slice(start, end);

    if (paginatedThoughts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No thoughts found for that query.",
        response: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Thoughts retrieved successfully.",
      page: +page,
      limit: +limit,
      total: thoughts.length,
      response: paginatedThoughts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching thoughts.",
      response: error,
    });
  }
});

// GET ONE THOUGHT BY ID
app.get("/thoughts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const thought = await Thought.findById(id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Thought found.",
      response: thought,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error finding thought.",
      response: error,
    });
  }
});

// GET LIKED THOUGHTS FOR A USER
app.get("/thoughts/liked/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const likedThoughts = await Thought.find({ likedBy: clientId });

    res.status(200).json({
      success: true,
      message: "Liked thoughts retrieved.",
      response: likedThoughts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving liked thoughts.",
      response: error,
    });
  }
});

// POST THOUGHT
app.post("/thoughts", authenticate, async (req, res) => {
  const { message, category } = req.body;

  try {
    const newThought = await new Thought({ message, category }).save();

    return res.status(200).json({
      success: true,
      response: newThought,
      message: "Thought created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      response: error,
      message: "Couldn't create thought.",
    });
  }
});

// DELETE THOUGHT
app.delete("/thoughts/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const thought = await Thought.findByIdAndDelete(id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "Thought could not be found. Can't delete.",
      });
    }

    return res.status(200).json({
      success: true,
      response: thought,
      message: "Thought successfully deleted.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      response: error,
      message: "Couldn't delete thought.",
    });
  }
});

// PATCH A THOUGHT
app.patch("/thoughts/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { newMessage } = req.body;

  try {
    const thought = await Thought.findByIdAndUpdate(
      id,
      { message: newMessage },
      { new: true, runValidators: true }
    );

    if (!thought) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "Thought couldn't be found.",
      });
    }

    return res.status(200).json({
      success: true,
      response: thought,
      message: "Thought updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      response: error,
      message: "Thought unable to be updated.",
    });
  }
});

// LIKE A THOUGHT
app.post("/thoughts/:id/like", authenticate, async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res
        .status(404)
        .json({ success: false, message: "Thought not found" });
    }

    if (thought.likedBy.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "You have already liked this thought",
      });
    }

    thought.hearts += 1;
    thought.likedBy.push(req.user.id);
    await thought.save();

    return res
      .status(200)
      .json({ success: true, message: "Thought liked", thought });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error liking thought", error });
  }
});

// UNLIKE A THOUGHT
app.delete("/thoughts/:id/like", authenticate, async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res
        .status(404)
        .json({ success: false, message: "Thought not found" });
    }

    if (!thought.likedBy.includes(req.user.id)) {
      return res
        .status(400)
        .json({ success: false, message: "You haven't liked this thought" });
    }

    thought.hearts = Math.max(0, thought.hearts - 1);
    thought.likedBy = thought.likedBy.filter(
      (userId) => userId !== req.user.id
    );
    await thought.save();

    return res
      .status(200)
      .json({ success: true, message: "Thought unliked", thought });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error unliking thought", error });
  }
});

// START SERVER //
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
