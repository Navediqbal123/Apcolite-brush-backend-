// middleware/shopkeeper.js

export default function shopkeeperOnly(req, res, next) {
  try {
    const user = req.user;

    // Check: logged in?
    if (!user) {
      return res.status(401).json({ error: "Login required" });
    }

    // Check: role must be shopkeeper
    if (user.role !== "shopkeeper") {
      return res.status(403).json({ error: "Access denied. Shopkeeper only." });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
