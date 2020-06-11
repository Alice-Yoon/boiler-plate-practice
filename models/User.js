const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const jwt = require('jsonwebtoken');

// userSchema
const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

// 비밀번호 암호화 
    // .pre는 mongoose의 기능
    // 이건 save하기 '전'에 뭔갈 하겠다는 의미.
    // 들어온 user 정보를 그대로 save해서 db에 전달하면 비밀번호가 그대로 노출되니까 보안이 똥임.
    // 그래서 그 전에 비밀번호를 암호화 해야함! 그 기능을 수행할 것이 바로 이 'pre'임.
    // 이 pre의 기능을 완료한 후에는 next(=save)로 이동할 것임!
userSchema.pre('save', function(next) {
    var user = this;

    // 그냥 pre 'save'로 걸어두면, 모든 save할때마다 비밀번호 암호화 진행됨.
    // 그래서 조건을 isModified('password')로, password가 save 될때만 진행!
    if (user.isModified('password')) {

        // 비밀번호를 암호화 시킨다.
        // 암호화 하기 위해 bcrypt를 다운 받았지!
        bcrypt.genSalt(saltRounds, function(err, salt) {
    
            if(err) return next(err)
            
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return next(err)
                user.password = hash
                next()
            })
        })
    } else {
        next();
    }

})


// 비밀번호 compare 메소드
userSchema.methods.comparePassword = function(plainPassword, cb) {

    // "plainPassword 1234567" "암호화된 비밀번호 ldfj2ok3r4kl12"를 비교
        // 비교를 위해선 plainPassword를 암호화해야 함! 이미 암호화된건 복호화 할수 없음.
        // 이런 비교에선 bcrypt.compare을 써서 plain과 암호화된 비밀번호 비교 가능!
    bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
        if (err) return cb(err),
            cb(null, isMatch)
            // .compare에서는 저 isMatch의 자리에 true/false의 res를 담는다
    })
}


// Token 생성 메소드
userSchema.methods.generateToken = function(cb) {

    var user = this;

    // jsonwebtoken을 이용해서 token 생성하기
    var token = jwt.sign(user._id.toHexString(), 'secretToken');
        // user._id + 'secretToken' = token
        // 나중에 'secretToken'을 넣으면 -> user._id를 찾을 수 있음.

    user.token = token;
    user.save(function(err, user) {
        if(err) return cb(err)
        cb(null, user)
    })

}


// Token으로 유저 찾기
userSchema.statics.findByToken = function (token, cb) {
    var user = this;

    // 토큰을 decode 한다.
        // decoded는 user._id ("uer._id + 'secretToken' = token" )
    jwt.verify(token, 'secretToken', function(err, decoded) {
        // 유저 아이디를 이용해서 유저를 찾은 다음,
        // 클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인.
        user.findOne({ "_id": decoded, "token": token }, function(err, user) {
            if(err) return cb(err);
            cb(null, user)
        })


    })
}



const User = mongoose.model('User', userSchema);

module.exports = { User };