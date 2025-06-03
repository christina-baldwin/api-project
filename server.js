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

// connect to database
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl);

// DB CONNECTION (CHECK THIS!)
const thoughtSchema = new mongoose.Schema({
  id: Number,
  message: String,
  hearts: Number,
  likedBy: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Thought = mongoose.model("Thought", thoughtSchema);

if ((process.env.RESET_DB = "true")) {
  const seedDatabase = async () => {
    await Thought.deleteMany({});
    data.forEach((thought) => {
      new Thought(thought).save();
    });
  };
  seedDatabase();
}

// API DOCUMENTATION //
app.get("/", (req, res) => {
  // Thought.find().then((thoughts) => {
  //   res.json(thoughts);
  // });

  const endpoints = listEndpoints(app);
  res.json({
    message: "Welcome to the Happy Thougts API",
    endpoints: endpoints,
  });
});

// ROUTES AND ENDPOINTS //
// get all thoughts
app.get("/thoughts", async (req, res) => {
  const { category, sortBy, page = 1, limit = 10 } = req.query;

  let filteredThoughts = await Thought.find();

  if (category) {
    filteredThoughts = filteredThoughts.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (sortBy === "date") {
    filteredThoughts = filteredThoughts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  const start = (page - 1) * limit;
  const end = start + +limit;

  const paginatedThoughts = filteredThoughts.slice(start, end);

  res.json({
    page: +page,
    limit: +limit,
    total: filteredThoughts.length,
    thoughts: paginatedThoughts,
  });
});

// get one thought
app.get("/thoughts/:id", (req, res) => {
  const { id } = req.params;
  const thought = data.find((item) => item.id === +id);

  if (!thought) {
    return res.status(404).json({ error: "Thought not found" });
  }

  res.json(thought);
});

// get liked thoughts
app.get("/thoughts/liked/:clientId", (req, res) => {
  const { clientId } = req.params;
  const likedThoughts = data.filter((thought) =>
    thought.likedBy.includes(clientId)
  );

  res.json(likedThoughts);
});

// cant do these yet i think (maybe next week?)
app.delete("/thoughts:id", (req, res) => res.send("placeholder"));

app.post("/thoughts", (req, res) => res.send("placeholder"));

app.post("/thoughts/:id/like", (req, res) => res.send("placeholder"));

app.delete("/thoughts/:id/like", (req, res) => res.send("placeholder"));

// SERVER START //
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
