import books from '../models/books.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    // 檢查是否已存在相同書籍
    const existingBook = await books.findOne({ title: req.body.title })
    if (existingBook) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '重複引入'
      })
    }

    // 確保圖片 URL 被傳遞，並將其添加到書籍資料中
    const imageUrl = req.body.imageUrl || null // 獲取從前端傳來的圖片 URL

    const bookData = {
      ...req.body,
      imageUrl // 將圖片 URL 添加到書籍資料中
    }

    // 創建新書籍
    const result = await books.create(bookData)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    console.log(error)
    // 錯誤處理
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
        message: '重複引入'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const getAll = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = parseInt(req.query.sortOrder) || -1
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 20
    const page = parseInt(req.query.page) || 1
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await books
      .find({
        $or: [
          { title: regex },
          { authors: regex },
          { publisher: regex }
        ]
      })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage === -1 ? undefined : itemsPerPage)

    const total = await books.estimatedDocumentCount()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const get = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = parseInt(req.query.sortOrder) || -1
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 20
    const page = parseInt(req.query.page) || 1
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await books
      .find({
        $or: [
          { title: regex },
          { authors: regex },
          { publisher: regex }
        ]
      })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage === -1 ? undefined : itemsPerPage)
    const total = await books.countDocuments
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const getId = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await books.findById(req.params.id).populate('reviews.user', 'account')

    if (!result) throw new Error('NOT FOUND')

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    console.error(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無書本'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const deleteBook = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await books.findByIdAndDelete(req.params.id)

    if (!result) throw new Error('NOT FOUND')

    res.status(StatusCodes.OK).json({
      success: true,
      message: '書本已刪除',
      result
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無書本'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const editBook = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const updatedFields = {
      title: req.body.title,
      authors: req.body.authors,
      publisher: req.body.publisher,
      retailPrice: req.body.retailPrice,
      categories: req.body.categories,
      description: req.body.description
    }

    const result = await books.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true, // Return the updated document
      runValidators: true // Validate the updates against the model's schema
    })

    if (!result) throw new Error('NOT FOUND')

    res.status(StatusCodes.OK).json({
      success: true,
      message: '書籍已成功更新',
      result
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無書籍'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const addreviews = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await books.findById(req.params.id)

    if (!result) throw new Error('NOT FOUND')

    const existingReview = result.reviews.find(review => review.user.toString() === req.user._id.toString())
    if (existingReview) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '評論只能寫一次'
      })
      return
    }
    const reviews = {
      user: req.user._id,
      comment: req.body.conmment,
      rating: req.body.rating
    }

    result.reviews.push(reviews)
    await result.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        comment: req.body.conmment,
        rating: req.body.rating,
        _id: result.reviews[result.reviews.length - 1]._id,
        reply: [],
        user: {
          account: req.user.account,
          _id: req.user._id
        }
      }
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
        message: '查無書本'
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

export const editreviews = async (req, res) => {
  try {
    console.log('Request body:', req.body) // 檢查請求體
    console.log('Request params:', req.params) // 檢查路由參數

    if (!validator.isMongoId(req.params.bookId)) throw new Error('ID')
    const book = await books.findById(req.params.bookId) // 使用 req.params.bookId
    const review = book.reviews.id(req.params.reviewId)

    if (review) {
      review.rating = req.body.rating
      review.comment = req.body.comment
      await book.save()
      res.status(StatusCodes.OK).json({
        success: true,
        message: '編輯成功'
      })
    } else {
      throw new Error('NOT FOUND')
    }
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無書本或評論'
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

export const getFavoritebook = async (req, res) => {
  try {
    // 從請求的查詢參數中獲取書籍 ID
    const bookIds = req.query.bookIds.split(',')

    // 根據書籍 ID 查詢書籍
    const result = await books.find({ _id: { $in: bookIds }, favorite: true })

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
