var passport = require('passport');
var LocalStrategy = require("passport-local").Strategy;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mysql = require('mysql');
var app = express();
// security
var crypto = require('crypto');
var jwt = require('jsonwebtoken');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV!='production') {
  var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "cmimc"
  });
} else {
  var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
}
connection.connect();

// refresh connection every 30 min
setTimeout (function () {
  connection.query('SELECT 1');
},1000*60*30);

passport.use(new LocalStrategy(
  function(username, password, done) {
    var email = username;
    connection.query("SELECT * FROM staff WHERE email='"+email+"' LIMIT 1", function(err, rows, fields) {
      if (err) { return done(err); }

      if(rows.length == 0) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      else {
        var submitPassword = rows[0].password;
        var salt = rows[0].salt;
        var hash = crypto.pbkdf2Sync(password, salt, 1000, 64).toString('hex');
        if (submitPassword !== hash) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, rows[0]);
      }
      });
    }));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

var routes = require('./routes');
app.use('/', routes);

var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
