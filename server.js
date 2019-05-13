const express = require('express');
const app = express();
const mongoose = require('mongoose');
const databaseUrl = 'mongodb://localhost:27017/auth';
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const userSchema = new mongoose.Schema({
  userName: {type: String, required: true},
  password: {type: String, required: true}
}, {versionKey: false})

const usersModel = mongoose.model('users', userSchema);

mongoose.set('useNewUrlParser', true);

app.listen(4000, async () => {
  console.log('Server is running');
  await mongoose.connect(databaseUrl);
  console.log('Database connected');
})

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.post('/users/create', async (req, res, next) => {
  await usersModel.create(req.body );
  res.status(201).json({msg: 'User created'})
})

app.post('/users/login', async (req, res, next) => {
  try {
    const findUser = await usersModel.findOne({userName: req.body.userName, password: req.body.password}, {_id: 0});
    if (!findUser) {
      return res.status(400).json({msg: 'Either username or password not correct'});
    }

    const initialToken = await jwt.sign({userName: findUser.userName}, 'iAmALittleMonkeyAndILikeToGoRoundAndRound');

    res.cookie('authToken', initialToken, {httpOnly: true});
    res.status(200).json({userName: findUser.userName});
  } catch (error) {
    next(error);
  }

})

app.delete('/users/deleteAccount', async (req, res, next) => {

  try {
    const inputToken = req.cookies.authToken;

    console.log(inputToken);
    const tokenVerified = await jwt.verify(inputToken, 'iAmALittleMonkeyAndILikeToGoRoundAndRound');
    const decodedUser = await jwt.decode(inputToken, 'iAmALittleMonkeyAndILikeToGoRoundAndRound');

    await usersModel.findOneAndDelete({userName: decodedUser.userName});

    res.status(202).json({message: 'User was deleted'})
  } catch (error) {
    next(error);
  }

})

app.get('/users/logout', async (req, res, next) => {

  try {
    const inputToken = req.cookies.authToken;

    await jwt.verify(inputToken, 'iAmALittleMonkeyAndILikeToGoRoundAndRound');

    res.clearCookie('authToken');

    res.status(200).json({msg: 'You are succesfully logged out'});

  }catch (error) {
    next(error);
  }

})


app.use((err, req, res, next) => {
  err.status = err.status || 500;
  res.status(err.status).json({msg: err.message});
})
