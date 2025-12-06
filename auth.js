import jwt from 'jsonwebtoken'

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,  // BACKEND JWT SECRET KEY
    { expiresIn: '7d' }
  )
}
