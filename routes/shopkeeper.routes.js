import express from "express";
import shopkeeperOnly from "../middleware/shopkeeper.js";
import { becomeShopkeeper, shopkeeperDashboard } from "../controllers/shopkeeper.controller.js";

const router = express.Router();

router.post("/become-shopkeeper", becomeShopkeeper);
router.get("/dashboard", shopkeeperOnly, shopkeeperDashboard);

export default router;
