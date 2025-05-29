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
app.get("/thoughts", (req, res) => res.send("getThoughts placeholder"));

app.delete("/thoughts:id", (req, res) =>
  res.send("deleteThoughts placeholder")
);

app.get("/thoughts/liked/:clientId", (req, res) =>
  res.send("likedThoughts placeholder")
);

app.post("/thoughts", (req, res) => res.send("postThought placeholder"));

app.post("/thoughts/:id/like", (req, res) =>
  res.send("likeThought placeholder")
);

app.delete("/thoughts/:id/like", (req, res) =>
  res.send("unlikeThought placeholder")
);

// endpoint for getting all flowers
// TODO: add query params to be able to filter on color or sort by name
app.get("/flowers", (req, res) => {
  const { color, size } = req.query;

  let filteredFlowers = data;

  if (color) {
    filteredFlowers = filteredFlowers.filter(
      (flower) => flower.color.toLowerCase() === color.toLowerCase()
    );
  }
  if (size) {
    filteredFlowers = filteredFlowers.filter(
      (flower) => flower.size.toLowerCase() === size.toLowerCase()
    );
  }

  res.json(filteredFlowers);
});

// endpoint for gettin one flower
app.get("/flowers/:id", (req, res) => {
  // be aware! The id that comes from the param is of type string. and in our json it is of type number. You have to turn them into the same type before you can compare them. trun a string to a number by adding + 👇
  const flower = data.find((flower) => flower.id === +req.params.id);

  // tiny error handling if we get an id that doesnt exist in our data
  if (!flower) {
    return res.status(404).json({ error: "flower not found" });
  }

  res.json(flower);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
