const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require('body-parser');

const config = require('./config/key');

const { User } = require('./models/User');

// application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// application/json
app.use(bodyParser.json());

// mongoose를 사용해서 mongoDB와 내 프로젝트 연결!
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log("MongoDB connected...")).catch(err => console.log(err))


//  Example Route
app.get('/', (req, res) => res.send("Hi worldddd finally hahaha"));



// 회원가입을 위한 Route
app.post('/register', (req, res) => {

    // 회원 가입 할 때 필요한 정보들을 client에서 가져오면
    // 그것들을 데이터 베이스에 넣어준다.

    const user = new User(req.body)

    // .save는 mongoDB의 method
    // 이렇게 save하면 req.body로 넘어온 정보가 user model에 저장이 됨.
    user.save((err, userInfo) => {

        if (err) return res.json({success: false, err})
        return res.status(200).json({
            success: true
        })

    })


})



app.listen(port, () => console.log(`Example app listening on port ${port}`));
