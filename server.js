import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import supabase from "./supabase.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// TEST
app.get("/", (req, res) => {
  res.send("Apcolite Brush Backend Running ✅");
});

// ============ AUTH ============

// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  // 1️⃣ Supabase Auth SignUp
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  // authData.user sometimes null → FIX
  const userId = authData?.user?.id;
  if (!userId) {
    return res.status(400).json({ error: "Signup failed. user.id missing" });
  }

  // 2️⃣ Insert user in users table
  const { error: insertError } = await supabase
    .from("users")
    .insert([{ id: userId, email: email, role: "user" }]);

  if (insertError) {
    return res.status(400).json({ error: insertError.message });
  }

  res.json({ success: true, user: authData.user });
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: data.user.id, email: data.user.email },
    process.env.JWT_SECRET
  );

  res.json({ user: data.user, token });
});

// USERS LIST
app.get("/users", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// MAKE OWNER
app.post("/make-owner", async (req, res) => {
  const { user_id } = req.body;

  const { error } = await supabase
    .from("users")
    .update({ role: "owner" })
    .eq("id", user_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, message: "User is now OWNER ✅" });
});

// PRODUCTS LIST
app.get("/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ADD PRODUCT
app.post("/add-product", async (req, res) => {
  const { name, price, image } = req.body;

  const { error } = await supabase
    .from("products")
    .insert([{ name, price, image }]);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// REALTIME
supabase
  .channel("realtime-products")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "products" },
    (payload) => {
      console.log("Realtime Product Event:", payload);
    }
  )
  .subscribe();

// SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
