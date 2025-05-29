import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints";

import data from "./data/data.json";

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// documentation of the API
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);
  res.json({
    message: "Welcome to the Happy Thougts API",
    endpoints: endpoints,
  });
});

// routes and endpoints
// get all thoughts
app.get("/thoughts", (req, res) => {
  res.json(data);
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
