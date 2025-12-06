import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import supabase from './supabase.js'
import { generateToken } from './auth.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// SERVER TEST
app.get('/', (req, res) => {
  res.send('Apcolite Brush Backend Running ✅')
})

/* ---------------- AUTH ---------------- */

// Login API
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) return res.status(401).json({ error: 'Invalid credentials' })

  const token = generateToken(data.user)
  res.json({ user: data.user, token })
})

/* ---------------- USERS ---------------- */

app.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*')
  if (error) return res.status(400).json({ error })
  res.json(data)
})

// Make user OWNER
app.post('/make-owner', async (req, res) => {
  const { user_id } = req.body

  const { error } = await supabase
    .from('users')
    .update({ role: 'owner' })
    .eq('id', user_id)

  if (error) return res.status(400).json({ error })
  res.json({ success: true })
})

/* ---------------- PRODUCTS ---------------- */

app.get('/products', async (req, res) => {
  const { data, error } = await supabase.from('products').select('*')
  if (error) return res.status(400).json({ error })
  res.json(data)
})

app.post('/add-product', async (req, res) => {
  const { name, price, image } = req.body

  const { error } = await supabase
    .from('products')
    .insert([{ name, price, image }])

  if (error) return res.status(400).json({ error })
  res.json({ success: true })
})

/* ---------------- REALTIME ---------------- */

supabase
  .channel('realtime-products')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'products' },
    payload => {
      console.log('Realtime Product Event:', payload)
    }
  )
  .subscribe()

/* ---------------- SERVER START ---------------- */

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})
