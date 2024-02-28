import { Router } from 'express'
import { create, login, logout, extend, getProfile, addFavorite, checkFavoriteStatus } from '../controllers/users.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

router.post('/', create)
router.post('/login', auth.login, login)
router.delete('/logout', auth.jwt, logout)
router.patch('/extend', auth.jwt, extend)
router.get('/me', auth.jwt, getProfile)
router.post('/favorite', auth.jwt, addFavorite)
router.get('/favorite', auth.jwt, checkFavoriteStatus)
export default router
