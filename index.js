import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import compression from 'compression'
import path from 'path'
import { fileURLToPath } from 'url'
import routeUsers from './routes/users.js'
import routeBooks from './routes/books.js'
import routeOrders from './routes/orders.js'
import { StatusCodes } from 'http-status-codes'
import './passport/passport.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(compression())

app.use(cors({
  // origin = 請求的來源
  // callback(錯誤, 是否允許)
  // 允許哪些地方的跨域請求
  origin (origin, callback) {
    if (!origin || origin.includes('github.io') || origin.includes('localhost')) {
      callback(null, true)
    } else {
      callback(new Error('CORS not allowed'), false)
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
// app.use((_, req, res, next) => {
//   res.status(StatusCodes.FORBIDDEN).json({
//     success: false,
//     message: '請求被拒絕'
//   })
// })

app.options('*', cors())
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  immutable: true
}))

app.use(express.json())
// app.use((_, req, res, next) => {
//   res.status(StatusCodes.BAD_REQUEST).json({
//     success: false,
//     message: '資料格式錯誤'
//   })
// })

app.use('/users', routeUsers)
app.use('/books', routeBooks)
app.use('/orders', routeOrders)

app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到'
  })
})

app.listen(process.env.PORT || 4000, async () => {
  console.log('伺服器啟動')
  await mongoose.connect(process.env.DB_URL)
  console.log('資料庫連線成功')
})
