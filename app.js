var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/userRouter');
var adminRouter = require('./routes/adminRouter');
var kepalaRouter = require('./routes/kepalaRouter')
var profileRouter = require('./routes/profileRouter');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.COOKIE_SECRET, 
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, 
    httpOnly: true, 
    maxAge: 30 * 60 * 1000 
  }
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/kepala', kepalaRouter)
app.use('/profile', profileRouter);

app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Headers:', req.headers);
  next();
});

app.use(cookieParser());

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

app.use((req, res, next) => {
  console.log('User in app middleware:', req.user);
  res.locals.user = req.user;
  next();
});

module.exports = app;
