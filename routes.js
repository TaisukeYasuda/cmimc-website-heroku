var app = require('express');
var router = app.Router();
var mysql = require('mysql');
var passport = require('passport');
// security
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var client_jwt = require('express-jwt');
var auth = client_jwt({secret: process.env.JWT_SECRET, userProperty: 'payload'});

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

/* GET home page. */
router.get('/', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

function generateJWT (name, email, type, id) {
  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    email: email,
    name: name,
    type: type,
    id: id,
    exp: parseInt(exp.getTime() / 1000),
  }, process.env.JWT_SECRET);
};

// routes for login and signup

router.post('/signup', function(req, res, next){
  if (!req.body.email || !req.body.password1 || !req.body.password2) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  if (req.body.password1 !== req.body.password2) {
    return res.status(400).json({message: 'The two passwords do not match'});
  }

  var salt = crypto.randomBytes(16).toString('hex');
  var user = {
    email: req.body.email,
    password: crypto.pbkdf2Sync(req.body.password1, salt, 1000, 64).toString('hex'),
    type: "Member",
    name: req.body.name,
    andrewid: req.body.andrewid,
    salt: salt
  };

  var sql = 'SELECT * FROM staff WHERE ?';
  var query = connection.query(sql, {email: user.email}, function(err, result) {
    if (err) {return next(err); }

    if (result.length > 0) {
      return res.status(400).json({message: 'This email is already taken'})
    }
    var sql = 'INSERT INTO staff SET ?';
    var query = connection.query(sql, user, function(err, result) {
      if (err) { return next(err); }
      var sql = 'SELECT * FROM staff WHERE ?'
      var query = connection.query(sql, {email: user.email}, function(err, result) {
        var user = result[0];
        return res.json({token: generateJWT(user.name, user.email, user.type, user.staffid)});
      });
    });
  });
});

router.post('/login', function(req, res, next){
  if(!req.body.email || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  req.body.username = req.body.email

  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }

    if (user){
      return res.json({token: generateJWT(user.name, user.email, user.type, user.staffid)});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

// routes for problem proposals

router.get('/proposals/bank/', auth, function(req, res, next) {
  // must be admin or secure member
  if (req.payload.type !== 'Admin' && req.payload.type !== 'Secure Member') {
    res.status(401).json({message: 'Unauthorized access to problem bank'});
  }
  var sql = 'SELECT probid, problem, topic, checked FROM proposals';
  var query = connection.query(sql, function(err, result) {
    if(err) { return next(err); }

    console.log('Problem bank requested')
    res.json(result);
  });
});

router.post('/proposals/', auth, function(req, res, next) {
  // proposer must match request
  if (req.payload.id != req.body.staffid) {
    res.status(401).json({message: 'Unauthorized post to problem proposals'});
  }
  var sql = 'INSERT INTO proposals SET ?';
  var query = connection.query(sql, req.body, function(err, result) {
    if(err) { return next(err); }

    res.json(result[0]);
  });
});

router.param('prob_staffid', function(req, res, next, id) {
  var sql = 'SELECT probid, problem, topic FROM proposals WHERE ? ORDER BY topic';
  var query = connection.query(sql, {staffid: id}, function(err, result) {
    if(err) { return next(err); }
    if(!result) { return next(new Error('can\'t find staffid')); }

    req.proposals = {
      proposals: result,
      staffid: id
    };
    return next();
  });
});

router.param('probid', function(req, res, next, id) {
  var sql = 'SELECT * FROM proposals WHERE ?';
  var query = connection.query(sql, {probid: id}, function(err, result) {
    if(err) { return next(err); }
    if(!result) { return next(new Error('can\'t find probid')); }

    req.prob = result;
    return next();
  });
});

router.get('/proposals/:prob_staffid', auth, function(req, res, next) {
  // must be proposer
  if (req.payload.id != req.proposals.staffid) {
    res.status(401);
  }
  console.log('Problem proposals for staff '+req.proposals.staffid.toString()+' requested');
  res.json(req.proposals.proposals);
});

router.get('/proposals/problem/:probid', auth, function(req, res, next) {
  // must be proposer, admin, or secure member
  if (req.payload.type != 'Admin' &&
      req.payload.type != 'Secure Member' &&
      req.payload.id != req.prob[0].staffid) {
    res.status(401);
  }
  res.json(req.prob);
});

router.put('/proposals/problem/:probid', auth, function(req, res, next) {
  // must be proposer
  if (req.payload.id != req.prob[0].staffid) {
    res.status(401);
  }

  var sql = 'UPDATE proposals SET ? WHERE probid='+mysql.escape(req.prob[0].probid);
  var query = connection.query(sql, req.body, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Problem '+req.prob[0].probid.toString()+' updated');
    res.status(200);
  });
});

router.put('/proposals/checked/:probid', auth, function(req, res, next) {
  // must be admin
  if (req.payload.type != 'Admin') {
    res.status(401);
  }

  var sql = 'UPDATE proposals SET ? WHERE probid='+mysql.escape(req.prob[0].probid);
  var query = connection.query(sql, {checked: req.body.checked}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    if (req.body.checked) {
      console.log('Problem '+req.prob[0].probid.toString()+' checked');
    } else {
      console.log('Problem '+req.prob[0].probid.toString()+' unchecked');
    }
    res.status(200);
  });
});

router.delete('/proposals/problem/:probid', auth, function(req, res, next) {
  // must be proposer
  if (req.payload.id != req.prob[0].staffid) {
    res.status(401).json({message: 'Unauthorized deletion of problem proposals'});
  }
  var sql = 'DELETE FROM proposals WHERE ?';
  var query = connection.query(sql, {probid: req.prob[0].probid}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    res.status(200);
  });
});

// routes for comments and alternate solutions

router.get('/comments/problem/:probid', auth, function(req, res, next) {
  var sql = 'SELECT * FROM comments WHERE ?';
  var query = connection.query(sql, {probid: req.prob[0].probid}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Comments requested for problem '+req.prob[0].probid.toString());
    res.json(result);
  });
});

router.post('/comments', auth, function(req, res, next) {
  var sql = 'INSERT INTO comments SET ?';
  var query = connection.query(sql, req.body, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Comment received: ');
    console.log(req.body);
    res.status(200);
  });
});

router.get('/solutions/problem/:probid', auth, function(req, res, next) {
  var sql = 'SELECT * FROM alternate_solutions WHERE ?';
  var query = connection.query(sql, {probid: req.prob[0].probid}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Alternate solutions requested for problem '+req.prob[0].probid.toString());
    res.json(result);
  });
});

router.post('/solutions', auth, function(req, res, next) {
  var sql = 'INSERT INTO alternate_solutions SET ?';
  var query = connection.query(sql, req.body, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Alternate solution received: ');
    console.log(req.body);
    res.status(200);
  });
});

// routes for staff members

router.get('/staff', auth, function(req, res, next) {
  var sql = 'SELECT * FROM staff';
  var query = connection.query(sql, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find staff')); }

    console.log('Staff list requested');
    res.json(result);
  });
});

router.param('staffid', function(req, res, next, id) {
  var sql = 'SELECT * FROM staff WHERE ?';
  var query = connection.query(sql, {staffid: id}, function(err, result) {
    if(err) { return next(err); }
    if(!result) { return next(new Error('can\'t find staffid')); }

    req.staff = result[0];
    return next();
  });
});

router.put('/staff/type/:staffid', auth, function(req, res, next) {
  // must be admin
  if (req.payload.type !== 'Admin') {
    res.status(401);
  }
  // cannot change own status (so that there will always be at least one admin)
  if (req.payload.id === req.staff.staffid) {
    res.status(401);
  }
  var sql = 'UPDATE staff SET ? WHERE staffid='+mysql.escape(req.staff.staffid);
  var query = connection.query(sql, {type: req.body.type}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find staffid')); }

    console.log('Staff account type of '+req.staff.staffid.toString()+' updated to '+req.body.type);
    res.status(200);
  });
});

module.exports = router
