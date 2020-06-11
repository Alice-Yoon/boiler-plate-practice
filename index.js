const express = require('express');
const app = express();
const mongoose = require('mongoose');
const port = 5000;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const config = require('./config/key');

const { User } = require('./models/User');
const { auth } = require('./middleware/auth'); 

// application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// application/json
app.use(bodyParser.json());
app.use(cookieParser());

// mongoose를 사용해서 mongoDB와 내 프로젝트 연결!
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log("MongoDB connected...")).catch(err => console.log(err))


//  Example Route
app.get('/', (req, res) => res.send("Hi worldddd finally yay"));



// 회원가입 기능을 위한 Route
app.post('/api/users/register', (req, res) => {

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


// 로그인 기능을 위한 Route
app.post('/api/users/login', (req, res) => {

    // (1) 요청된 이메일을 데이터베이스에서 있는지 찾는다.
        // 데이터베이스에서 찾을 땐 .findOne이라는 MongoDB method를 이용한다!
    User.findOne({ email: req.body.email }, (err, user) => {
        if(!user) {
            return res.json({
                loginSuccess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            })
        }

        // (2) 요청된 이메일이 데이터 베이스에 있다면, 비밀번호가 맞는지 확인한다.
        user.comparePassword(req.body.password, (err, isMatch) => {
        if (!isMatch)          
            return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다." })          
        })
        
        // (3) 비밀번호까지 맞다면, 토큰을 생성한다.
        user.generateToken((err, user) => {

            if(err) return res.status(400).send(err);

            // Token을 저장한다. 어디에? 쿠키, 로컬스토리지 등
            res.cookie("x_auth", user.token)
                .status(200)
                .json({loginSuccess: true, userId: user._id})
        })
    })
})


// Auth 기능을 위한 Route
app.get('/api/users/auth', auth, (req, res) => {

    // 여기까지 middleware를 통과해 왔다는 얘기는, Authentication이 True라는 말!
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })

    // 이렇게 정보를 전달해 주면, 어떤 페이지이던지 유저 정보를 이용할 수 있기 때문에 편해짐!

} )


// logout 기능을 위한 Route
app.get('/api/users/logout', auth, (req, res) => {
    
    User.findOneAndUpdate({_id: req.user._id}, {token: ""}, (err, user) => {
        if (err) return res.json({success: false, err});
        return res.status(200).send({
            success: true
        })
    })
})




app.listen(port, () => console.log(`Example app listening on port ${port}`));
