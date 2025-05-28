import express from "express";
import cors from "cors";

import flowerData from "./data/flowers.json";

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// TODO: add documentation of the API here with express-list-endpoints
app.get("/", (req, res) => {
  res.send("Hello Technigo! ❤️");
});

// endpoint for getting all flowers
// TODO: add query params to be able to filter on color or sort by name
app.get("/flowers", (req, res) => {
  const { color, size } = req.query;

  let filteredFlowers = flowerData;

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
  const flower = flowerData.find((flower) => flower.id === +req.params.id);

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
