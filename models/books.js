import { Schema, model, ObjectId } from 'mongoose'
const replySchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'users',
    required: [true, '沒有登入']
  },
  comment: {
    type: String
  }
})
const reviewsSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'users',
    required: [true, '沒有登入']
  },
  comment: {
    type: String
  },
  rating: {
    type: Number,
    required: true
  },
  reply: {
    type: [replySchema]
  }
})

const schema = new Schema({
  title: {
    type: String,
    required: [true, '缺少書本名稱']
  },
  authors: {
    type: String,
    required: [true, '缺少作者名稱']
  },
  publisher: {
    type: String,
    required: [true, '缺少出版者名稱']
  },
  retailPrice: {
    type: Number,
    required: [true, '缺少書本價格']
  },
  categories: {
    type: String,
    required: [true, '缺少書本分類']
  },
  description: {
    type: String,
    required: [true, '缺少書本簡介']
  },
  image: {
    type: String,
    required: [true, '缺少書本圖片']
  },
  maturityRating: {
    type: String,
    required: [true, '缺少分級']
  },
  reviews: {
    type: [reviewsSchema]
  }
}, {
  timestamps: true,
  versionKey: false
})

export default model('books', schema)
