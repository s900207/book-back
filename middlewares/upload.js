import express from 'express'
import { v2 as cloudinary } from 'cloudinary'
import { StatusCodes } from 'http-status-codes'

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

    // 將圖片從 URL 上傳到 Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
      transformation: { quality: 'auto', fetch_format: 'auto' }
    })

    res.status(StatusCodes.OK).json({
      success: true,
      secure_url: uploadResponse.secure_url
    })
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '圖片上傳失敗'
    })
  }
})

export default router
