const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const { ensureAuthenticated } = require('./config/auth');


const app = express();

app.set('view engine',"ejs");
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  }))

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });


mongoose.connect('mongodb+srv://admin-rishav:chemicalbond@cluster0.espvw.mongodb.net/todolistDB1',{useNewUrlParser:true,useUnifiedTopology:true});
const db = mongoose.connection;
db.on('error',()=>{
    console.log(error);
})
db.once('open',()=>{
    console.log("DB connected");
})

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const taskSchema = new mongoose.Schema({
    name: String
});

const Task = mongoose.model('Task',taskSchema);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const User = mongoose.model('User',userSchema)

const Strategy = require('passport-local').Strategy;

passport.use(new Strategy(
    {usernameField:"email"},
    (username,password,done)=>{
        User.findOne({email:username},(err,user)=>{
            if(err){ return done(err) }
            if(!user){
                return done(null,false,{ message: 'That email is not registered' })
            }
            bcrypt.compare(password, user.password, function(err, result) {
                if(!result){
                    return done(null,false,{ message: 'Password incorrect' })
                }
                else{
                    return done(null,user)
                }
            });
        })
    }
))

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

app.get('/',(req,res)=>{
    res.render('login',{
        UserError:"",
        Display:"display:none"
    });
})

app.get('/signup',(req,res)=>{
    res.render('signup',{
        PasswordError:""
    });
})

app.post('/signup',(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const rpassword = req.body.rpassword;
    if(rpassword==password){
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash) {
                const newUser = new User({
                    email:email,
                    password:hash
                })
                newUser.save((err)=>{
                    if(err){console.log(err)}
                    else{
                        req.flash('success_msg',"You are now registered and can log in.")
                        res.redirect('/')
                    }
                })
            });
        });  
    }
    else{
        res.render('signup',{
            PasswordError:"Password dont match"
        })
    }
})

app.post('/',passport.authenticate('local',{
    successRedirect:"/home",
    failureRedirect:"/",
    failureFlash: true
}))

app.get("/home",ensureAuthenticated ,(req,res)=>{
    var today = new Date();
    var options = {
        weekday : 'long',
        day : 'numeric',
        month : 'long'
    }

    var day = today.toLocaleDateString('en-US',options);
    Task.find({},(err,foundTasks)=>{
        if(err){
            console.log(err);
        }
        else{
         res.render('list',{DayType:day, NewListItems:foundTasks})
        }
    })
})

app.post('/home',(req,res)=>{
    addedItem = req.body.chore;
    const newTask = new Task({
        name:addedItem
    })
    newTask.save();
    res.redirect('/home');
})

app.post('/delete',(req,res)=>{
    taskID = req.body.checkbox;
    console.log(taskID);
    Task.findByIdAndDelete(taskID,(err)=>{
        if(err){
            console.log(err);
        }
        else{
            res.redirect('/home');
        }
    })
})

app.post('/logout',(req,res)=>{
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
})

app.listen(process.env.PORT || 3000,(req,res)=>{
    console.log("Server Running...");
})