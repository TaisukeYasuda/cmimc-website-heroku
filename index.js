var passport = require('passport');
var LocalStrategy = require("passport-local").Strategy;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var app = express();
// security
var crypto = require('crypto');
var jwt = require('jsonwebtoken');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// mongodb database

var connection;
if (process.env.NODE_ENV!='production') {
  connection = mongoose.connect('mongodb://localhost/cmimc_db');
} else {
  connection = mongoose.connect(process.env.MONGODB_URI);
}
autoIncrement.initialize(connection);

var StaffSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  type: String,
  andrewid: String,
  salt: String
});
StaffSchema.plugin(autoIncrement.plugin, { model: 'Staff', field: 'staffid' });
mongoose.model('Staff', StaffSchema);

var ProposalSchema = new mongoose.Schema({
  staffid: Number,
  topic: String,
  problem: String,
  answer: String,
  solution: String,
  difficulty: Number,
  checked: Boolean
});
ProposalSchema.plugin(autoIncrement.plugin, { model: 'Proposals', field: 'probid' });
mongoose.model('Proposals', ProposalSchema);

var CommentSchema = new mongoose.Schema({
  staffid: Number,
  probid: Number,
  comment: String
});
mongoose.model('Comments', CommentSchema);

var SolutionSchema = new mongoose.Schema({
  staffid: Number,
  probid: Number,
  solution: String
});
mongoose.model('Solutions', SolutionSchema);

var Staff = mongoose.model('Staff');
var Proposals = mongoose.model('Proposals');
var Comments = mongoose.model('Comments');
var Solutions = mongoose.model('Solutions');

// set up passport

passport.use(new LocalStrategy(
  function(username, password, done) {
    var email = username;
    Staff.find({email: email}, function(err, result) {
      if (err) { return done(err); }

      if(result.length == 0) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      else {
        var submitPassword = result[0].password;
        var salt = result[0].salt;
        var hash = crypto.pbkdf2Sync(password, salt, 1000, 64).toString('hex');
        if (submitPassword !== hash) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, result[0]);
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
