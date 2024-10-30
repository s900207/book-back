import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { StatusCodes } from 'http-status-codes'
import axios from 'axios'
import FormData from 'form-data'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'books',
    format: async (req, file) => 'jpg', // supports promises as well
    public_id: (req, file) => file.originalname
  }
})

const upload = multer({
  storage,
  fileFilter (req, file, callback) {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      callback(null, true)
    } else {
      callback(new multer.MulterError('LIMIT_FILE_FORMAT'), false)
    }
  },
  limits: {
    fileSize: 1024 * 1024
  }
})

const router = express.Router()

router.post('/upload', async (req, res, next) => {
  try {
    const { imageUrl } = req.body
    if (!imageUrl) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '缺少圖片 URL'
      })
    }

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(response.data, 'binary')

    const formData = new FormData()
    formData.append('file', buffer, { filename: 'image.jpg' })
    formData.append('upload_preset', 'YOUR_UPLOAD_PRESET')

    const cloudinaryResponse = await axios.post(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_NAME}/image/upload`, formData, {
      headers: formData.getHeaders()
    })

    res.status(StatusCodes.OK).json({
      success: true,
      secure_url: cloudinaryResponse.data.secure_url
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '圖片上傳失敗'
    })
  }
})

export default router
