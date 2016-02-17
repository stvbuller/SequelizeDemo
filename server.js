var express = require('express')
var app = express()
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser')
var session = require('express-session')
app.use(bodyParser.urlencoded({extended: false}));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
var mysql = require('mysql');
var Sequelize = require('sequelize');

var sequelize = new Sequelize('auth_db', 'root');

var PORT = process.env.NODE_ENV || 8090;

app.use(session({
  secret: 'abcder',
  cookie: {
    maxAge: 1000 * 600
  },
  saveUninitialized: true,
  resave: false
}));


var User = sequelize.define('User', {
  email: {
    type: Sequelize.STRING,
    unique: true
  },
  password: Sequelize.STRING,
  firstname: Sequelize.STRING,
  lastname: Sequelize.STRING
});

var Person = sequelize.define('Person', {
  firstname: Sequelize.STRING,
  lastname: Sequelize.STRING
});

var AlterEgo = sequelize.define('AlterEgo', {
  superhero: Sequelize.STRING
});

Person.hasMany(AlterEgo);

app.get('/', function (req, res) {
    res.render('home', {
      msg: req.query.msg
    });
});


app.post('/register', function(req, res) {
  User.create(req.body).then(function(user){
    req.session.authenticated = user;
    res.redirect('/success');
  }).catch(function(err) {
    res.redirect('/msg=' + err.message);
  });
});

app.post('/login', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  User.findOne({
    where: {
      email: email,
      password: password
    }
  }).then(function(user) {
    if (user) {
      req.session.authenticated = user;
      res.redirect('/success');
    } else {
      res.redirect('/?msg=Failed login attempt');
    }
  }).catch(function(err){
    throw err;
  });
});

app.get('/success', function (req, res, next){
  if (req.session.authenticated) {
    next();    
  } else {
    res.redirect("/?msg=You are not authenticated'");
  }
}, function(req, res){  
  res.send("You got it! " + req.session.authenticated.firstname);
});

app.get('/persons', function(req, res) {
  Person.findAll({
    include: [{
      model: AlterEgo
    }]
  }).then(function(people) {
    res.render('person' , {
      people: people
    })
  });
});

app.post('/persons', function(req, res) {
  Person.create(req.body).then(function() {
    res.redirect('/persons');
  });
});

app.post('/alteregos/:PersonId', function(req, res){
  AlterEgo.create({
    superhero: req.body.superhero,
    PersonId: req.params.PersonId
  }).then(function() {
    res.redirect('/persons');
  });
});

sequelize.sync();

app.listen(PORT, function(){
  console.log('Listening on %s', PORT)
})
