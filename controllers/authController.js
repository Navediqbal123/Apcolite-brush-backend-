// controllers/authController.js

import supabase from "../supabase.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  // default role = "user"
  await supabase.from("users").insert([
    { id: data.user.id, email, role: "user" }
  ]);

  res.json({ success: true, user: data.user });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: data.user.id, email: data.user.email },
    process.env.JWT_SECRET
  );

  res.json({ user: data.user, token });
}
