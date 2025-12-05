import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- ENV ---------------- */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

/* ---------------- COMMON HEADERS ---------------- */
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

/* ---------------- SUPABASE HELPERS ---------------- */
async function sbGet(table, query = "") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers,
  });
  return r.json();
}

async function sbPost(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return r.json();
}

async function sbPatch(table, query, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  return r.json();
}

async function sbDelete(table, query) {
  return await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: "DELETE",
    headers,
  });
}

/* ---------------- JWT TOKEN ---------------- */
function makeToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
}

/* ---------------- AUTH MIDDLEWARE ---------------- */
function auth(req, res, next) {
  const bearer = req.headers.authorization?.split(" ")[1];
  if (!bearer) return res.status(401).json({ error: "Unauthorized" });

  try {
    const data = jwt.verify(bearer, JWT_SECRET);
    req.userId = data.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ---------------- ROLE HELPERS ---------------- */
async function isAdmin(id) {
  const u = await sbGet("users", `?id=eq.${id}&select=role`);
  return u[0]?.role === "admin";
}

async function isOwner(id) {
  const u = await sbGet("users", `?id=eq.${id}&select=role`);
  return u[0]?.role === "owner";
}

/* ---------------- AUTH ---------------- */
app.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const exist = await sbGet("users", `?email=eq.${email}&select=id`);
  if (exist.length) return res.status(400).json({ error: "Email exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await sbPost("users", {
    name,
    email,
    password: hashed,
    role: "user",
    created_at: new Date().toISOString(),
  });

  res.json({ token: makeToken(user[0].id), user: user[0] });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const rows = await sbGet("users", `?email=eq.${email}&select=*`);
  if (!rows.length) return res.status(400).json({ error: "User not found" });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password);

  if (!ok) return res.status(400).json({ error: "Wrong password" });

  delete user.password;
  res.json({ token: makeToken(user.id), user });
});

/* ---------------- PRODUCTS ---------------- */
app.post("/products/create", auth, async (req, res) => {
  if (!(await isOwner(req.userId)))
    return res.status(403).json({ error: "Owner only" });

  const product = await sbPost("products", {
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    created_at: new Date().toISOString(),
  });

  res.json(product[0]);
});

app.get("/products", auth, async (req, res) => {
  const list = await sbGet("products", "?select=*");
  res.json(list);
});

app.get("/products/:id", auth, async (req, res) => {
  const pr = await sbGet("products", `?id=eq.${req.params.id}&select=*`);
  res.json(pr[0]);
});

app.patch("/products/:id", auth, async (req, res) => {
  if (!(await isOwner(req.userId)))
    return res.status(403).json({ error: "Owner only" });

  const out = await sbPatch("products", `?id=eq.${req.params.id}`, req.body);
  res.json(out);
});

app.delete("/products/:id", auth, async (req, res) => {
  if (!(await isOwner(req.userId)))
    return res.status(403).json({ error: "Owner only" });

  await sbDelete("products", `?id=eq.${req.params.id}`);
  res.json({ deleted: true });
});

/* ---------------- ADMIN ---------------- */
app.get("/admin/users", auth, async (req, res) => {
  if (!(await isAdmin(req.userId)))
    return res.status(403).json({ error: "Admin only" });

  const users = await sbGet("users", "?select=*");
  res.json(users);
});

app.post("/admin/make-owner/:id", auth, async (req, res) => {
  if (!(await isAdmin(req.userId)))
    return res.status(403).json({ error: "Admin only" });

  const out = await sbPatch("users", `?id=eq.${req.params.id}`, {
    role: "owner",
  });

  res.json(out);
});

app.post("/admin/remove-owner/:id", auth, async (req, res) => {
  if (!(await isAdmin(req.userId)))
    return res.status(403).json({ error: "Admin only" });

  const out = await sbPatch("users", `?id=eq.${req.params.id}`, {
    role: "user",
  });

  res.json(out);
});

app.get("/admin/stats", auth, async (req, res) => {
  if (!(await isAdmin(req.userId)))
    return res.status(403).json({ error: "Admin only" });

  const users = await sbGet("users", "?select=id");
  const owners = await sbGet("users", "?role=eq.owner");

  res.json({
    total_users: users.length,
    owners: owners.length,
  });
});

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🔥 Brush Backend Live on ${PORT}`));
