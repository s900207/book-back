import express from 'express'
import { v2 as cloudinary } from 'cloudinary'
import { StatusCodes } from 'http-status-codes'
import axios from 'axios'
import FormData from 'form-data'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

const router = express.Router()

router.post('/upload', async (req, res) => {
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
