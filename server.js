import cors from "cors";
import express from "express";
import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";

import data from "./data/data.json";

const port = process.env.PORT || 8080;
const app = express();

// MIDDLEWARES //
app.use(cors());
app.use(express.json());

// MONGO DB CONNECTION //
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl);
mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));

// SCHEMA //
const thoughtSchema = new mongoose.Schema({
  id: Number,
  message: String,
  hearts: Number,
  likedBy: [String],
  category: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Thought = mongoose.model("Thought", thoughtSchema);

// Seed database
const seedDatabase = async () => {
  await Thought.deleteMany({});
  data.forEach((thought) => {
    new Thought(thought).save();
  });
};
seedDatabase();

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

    res.status(200).json({
      success: true,
      message: "Thoughts retrieved successfully.",
      page: +page,
      limit: +limit,
      total: thoughts.length,
      response: paginatedThoughts,
    });
  } catch (error) {
    res.status(500).json({
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
    const thought = await Thought.findOne({ id: +id });

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Thought found.",
      response: thought,
    });
  } catch (error) {
    res.status(500).json({
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

// PLACEHOLDER ROUTES //
app.delete("/thoughts:id", (req, res) => res.send("placeholder"));

app.post("/thoughts", (req, res) => res.send("placeholder"));

app.post("/thoughts/:id/like", (req, res) => res.send("placeholder"));

app.delete("/thoughts/:id/like", (req, res) => res.send("placeholder"));

// START SERVER //
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
