const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const salt = bcrypt.genSaltSync(10);
const secret = 'saiehqe32978^#279hsydih30c';

app.use(cors({
    credentials:true,
    origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect('mongodb+srv://kahchun2002:9VkXzCmNF2jUD264@cluster0.pvvxib5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0' , {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
    console.log('MongoDB Connected');
}).catch((err)=>{
    console.log('Failed to connect to MongoDB', err);
});

app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    try {
        const userDoc = await User.create({
            username, 
            password:bcrypt.hashSync(password,salt)});
        res.json(userDoc);
    } catch (e) {
        console.log(e);
        if (e.code === 11000 && e.keyPattern.username) {
            return res.status(400).json({ e: 'Username already exists' });
        }
        return res.status(500).json({ e: 'Internal Server Error' });
    };
});

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const userDoc = await User.findOne({username});
    if (!userDoc) {
        return res.status(400).json({ field: 'username', error: 'User does not exist.' });
    }
    const passOK = bcrypt.compareSync(password, userDoc.password);
    if(passOK) {
        //logged in
        jwt.sign({username, id:userDoc._id}, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id:userDoc._id,
                username,
            });
        })
    } else {
        res.status(400).json({ field: 'password', error: 'Wrong password. Try again.'});
    };
});

app.get('/profile', (req, res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    })
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok'); //set token to empty string
})

app.listen(4000, () => {
    console.log('Server is listening on port 4000')
});

//Password: 9VkXzCmNF2jUD264 
//mongodb+srv://kahchun2002:<password>@cluster0.pvvxib5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0