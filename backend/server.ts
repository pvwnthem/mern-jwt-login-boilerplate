import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import config from "./config";
import speakeasy from 'speakeasy';
import uuid from 'uuid';
import User from './models/user'


const app = express()
const PORT = process.env.PORT || 5000



app.use(cors())
app.use(express.json())

mongoose.connect(config.MONGO_URI)

app.get('/', (req: any, res: any) => {
    res.send('Welcome to the system')
})

app.post('/register', async (req: any, res: any) => {
    try {
        const newPassword = await bcrypt.hash(req.body.password, 10)
        const secret = speakeasy.generateSecret();
        const id = uuid.v4()
        await User.create({
            name: req.body.name,
            email: req.body.email,
            password: newPassword,
            id: id,
            token: secret
        })
        res.json({ 
            status: 'OK' ,
            id: id,
            secret: secret.base32
        })
    } catch (err) {
        res.json({ 
            status: 'error',
            error: err
        })
    }
})

app.post('/verify', async (req, res) => {
    const {token, id} = req.body;
    try {
        const user = await User.findOne({id})

    }
    catch (err) {
        res.status(500)
    }
})







app.post('/login', async (req: any, res: any) => {
    const user = await User.findOne({ 
        email: req.body.email
    })

    if (!user) return { status: 'error', error: 'Invalid Login' }
    const isPasswordValid = await bcrypt.compare(
        req.body.password, 
        user.password
    )

    if (isPasswordValid) {
        const token = jwt.sign(
            {
                name: user.name,
                email: user.email,
                token: user.token,
                id: user.id
            },
            config.JWT_SECRET
        )

        return res.json({
            status: 'OK',
            user: token
        })
    } else {
        return res.json({
            status: 'error', 
            user: false
        })
    }
})

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})
