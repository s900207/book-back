import users from '../models/users.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import books from '../models/books.js'
import validator from 'validator'

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
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        token,
        account: req.user.account,
        email: req.user.email,
        role: req.user.role,
        cart: req.user.cartQuantity,
        nickname: req.user.account
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
        role: req.user.role,
        cart: req.user.cartQuantity
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

export const editCart = async (req, res) => {
  try {
    // 檢查商品 id 格式
    if (!validator.isMongoId(req.body.book)) throw new Error('ID')

    // 尋找購物車內有沒有傳入的商品 ID
    const idx = req.user.cart.findIndex(item => item.book.toString() === req.body.book)
    if (idx > -1) {
      // 修改購物車內已有的商品數量
      const quantity = req.user.cart[idx].quantity + parseInt(req.body.quantity)
      // 檢查數量
      if (quantity <= 0) {
        req.user.cart.splice(idx, 1)
      } else {
        req.user.cart[idx].quantity = quantity
      }
    } else {
      // 檢查商品是否存在或已下架
      const book = await books.findById(req.body.book).orFail(new Error('NOT FOUND'))
      req.user.cart.push({
        book: book._id,
        quantity: req.body.quantity
      })
    }

    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.cartQuantity
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else if (error.message === 'QUANTITY') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '數量格式錯誤'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const getCart = async (req, res) => {
  try {
    const result = await users.findById(req.user._id, 'cart').populate('cart.book')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.cart
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const editNickname = async (req, res) => {
  try {
    const { nickname } = req.body // 從請求中取得新的暱稱

    // 驗證暱稱格式，例如檢查長度或不允許空白等
    if (!nickname || nickname.trim() === '') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '暱稱不能為空'
      })
    }

    // 更新使用者的暱稱
    req.user.nickname = nickname.trim()
    await req.user.save() // 儲存更改

    res.status(StatusCodes.OK).json({
      success: true,
      message: '暱稱已更新',
      result: {
        nickname: req.user.nickname
      }
    })
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
