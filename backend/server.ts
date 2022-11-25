import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import config from "./config";
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import User from './models/user'
import bodyParser from 'body-parser'

const app = express()
const PORT = process.env.PORT || 5000



app.use(cors())
app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect(config.MONGO_URI)

app.get('/', (req: any, res: any) => {
    res.send('Welcome to the system')
})

app.post('/register', async (req: any, res: any) => {
    try {
        const newPassword = await bcrypt.hash(req.body.password, 10)
        const secret = speakeasy.generateSecret().base32;
        const id = uuidv4()
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
            secret: secret
        })
    } catch (err) {
        res.json({ 
            status: 'error',
            error: err
        })
        console.error(err)
    }
})

app.post('/verify', async (req, res) => {
    const {token, id} = req.body;
    try {
        const user = await User.findOne({id})
        const secret = user.token
        const verified =speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,

        })
        if (verified) {
            await User.findOneAndUpdate({id}, {verified: true})
            res.json({verified: true})
        } else {
            res.json({verified: false})
        }

    }
    catch (err) {
        console.log(err)
        res.status(500).json({err: err})
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
