import users from '../models/users.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
const ObjectId = mongoose.Types.ObjectId

export const create = async (req, res) => {
  try {
    await users.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '帳號已註冊'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const login = async (req, res) => {
  try {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1 s' })
    req.user.tokens.push(token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        token,
        account: req.user.account,
        email: req.user.email,
        role: req.user.role
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const logout = async (req, res) => {
  try {
    req.tokens = req.user.tokens.filter(token => token !== req.token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
export const extend = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex(token => token === req.token)
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens[idx] = token
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: token
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const getProfile = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        account: req.user.account,
        email: req.user.email,
        role: req.user.role
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
export const addFavorite = async (req, res) => {
  try {
    const { bookId, isFavorite } = req.body
    console.log(bookId, isFavorite)
    const user = await users.findById(req.user._id)
    // console.log(req.user._id)
    // console.log(user) // user 代表是找到的使用者

    if (isFavorite) {
      // if (!user.favorite.includes(bookId)) {
      //   user.favorite.push({ bookId, isFavorite })
      //   console.log(user.favorite)
      // }
      const existingFavorite = user.favorite.find((fav) => {
        return fav.book.toString() === bookId
      })
      console.log(existingFavorite)
      if (existingFavorite) {
        // 移除有的元素
        const index = user.favorite.indexOf(existingFavorite)
        user.favorite.splice(index, 1)
      } else {
        user.favorite.push({ book: new ObjectId(bookId), isFavorite })
      }
      // user.favorite.push({ book: bookId, isFavorite })
    } else {
      const existingFavorite = user.favorite.find((fav) => {
        return fav.book.toString() === bookId
      })
      const index = user.favorite.indexOf(existingFavorite)
      if (index > -1) {
        user.favorite.splice(index, 1)
      }
    }
    await user.save()
    // console.log(user.favorite)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: user.favorite
    })
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
export const checkFavoriteStatus = async (req, res) => {
  try {
    // console.log(req.user._id)
    const user = await users.findById(req.user._id).populate('favorite', '_id')
    console.log(user.favorite)
    const bookIds = user.favorite.map(fav => fav.book._id)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: bookIds
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
