import supabase from "../supabase.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true, user: data.user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: data.user.id },
    process.env.JWT_SECRET
  );

  res.json({ token, user: data.user });
};
