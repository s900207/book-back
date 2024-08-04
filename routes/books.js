import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import { create, getAll, deleteBook, get, getId, addreviews, editreviews, editBook } from '../controllers/books.js'
import upload from '../middlewares/upload.js'
import admin from '../middlewares/admin.js'

const router = Router()

router.post('/', auth.jwt, admin, upload, create)
router.get('/all', auth.jwt, admin, getAll)
router.delete('/:id', auth.jwt, admin, deleteBook)
router.patch('/:id', auth.jwt, admin, editBook)
router.get('/', get)
router.get('/:id', getId)
router.post('/:id/reviews', auth.jwt, addreviews)
router.patch('/:id/reviews', auth.jwt, editreviews)

export default router
