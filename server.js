import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import shopkeeperRoutes from "./routes/shopkeeper.routes.js";
import productRoutes from "./routes/product.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// test
app.get("/", (req, res) => {
  res.send("StoreLink Backend Running ✅");
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/shopkeeper", shopkeeperRoutes);
app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
