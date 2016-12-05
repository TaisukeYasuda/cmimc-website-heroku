var app = require('express');
var router = app.Router();
var mongoose = require('mongoose');
var passport = require('passport');
// security
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var client_jwt = require('express-jwt');
var auth = client_jwt({secret: process.env.JWT_SECRET, userProperty: 'payload'});

var Staff = mongoose.model('Staff');
var Proposals = mongoose.model('Proposals');
var Comments = mongoose.model('Comments');
var Solutions = mongoose.model('Solutions');

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

router.generateJWT = generateJWT

/* GET home page. */
router.get('/', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

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
    type: 'Member',
    name: req.body.name,
    andrewid: req.body.andrewid,
    salt: salt
  };

  Staff.find({email: user.email}, function(err, result) {
    if (err) {return next(err); }

    if (result.length > 0) {
      return res.status(400).json({message: 'This email is already taken'})
    }

    if (user.email === 'taisukey@andrew.cmu.edu') {
      user.type = 'Admin';
    } else {
      user.type = 'Member';
    }

    Staff.create(user, function(err, result) {
      if (err) { return next(err); }
      Staff.findOne({email: user.email}, function(err, user) {
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
  Proposals.find(function(err, result) {
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
  Proposals.create(req.body, function(err, result) {
    if(err) { return next(err); }

    res.json(result);
  });
});

router.param('prob_staffid', function(req, res, next, id) {
  Proposals.find({staffid: id}, function(err, result) {
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
  Proposals.find({probid: id}, function(err, result) {
    if(err) { return next(err); }
    if(!result) { return next(new Error('can\'t find probid')); }

    req.prob = result;
    return next();
  });
});

router.param('commentid', function(req, res, next, id) {
  Comments.find({commentid: id}, function(err, result) {
    if(err) { return next(err); }
    if(!result) { return next(new Error('can\'t find commentid')); }

    req.comm = result;
    return next();
  });
});

router.param('solutionid', function(req, res, next, id) {
  Solutions.find({solutionid: id}, function(err, result) {
    if(err) { return next(err); }
    if(!result) { return next(new Error('can\'t find solutionid')); }

    req.sol = result;
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

  Proposals.update({probid: req.prob[0].probid}, req.body, function(err, result) {
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

  Proposals.update({probid: req.prob[0].probid}, {checked: req.body.checked}, function(err, result) {
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
  Proposals.remove({probid: req.prob[0].probid}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    res.status(200).json({probid: req.prob[0].probid});
  });
});

// routes for comments and alternate solutions

router.get('/comments/problem/:probid', auth, function(req, res, next) {
  Comments.find({probid: req.prob[0].probid}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Comments requested for problem '+req.prob[0].probid.toString());
    res.json(result);
  });
});

router.post('/comments', auth, function(req, res, next) {
  Comments.create(req.body, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Comment received: ');
    console.log(req.body);
    res.status(200).json(req.body);
  });
});

router.delete('/comments/problem/:commentid', auth, function(req, res, next) {
  if (req.payload.id != req.comm[0].staffid) {
    res.status(401).json({message: 'Unauthorized deletion of comment'});
  }
  Comments.remove({commentid: req.comm[0].commentid}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find commentid')); }

    res.status(200).json({commentid: req.comm[0].commentid});
  });
});

router.get('/solutions/problem/:probid', auth, function(req, res, next) {
  Solutions.find({probid: req.prob[0].probid}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Alternate solutions requested for problem '+req.prob[0].probid.toString());
    res.json(result);
  });
});

router.post('/solutions', auth, function(req, res, next) {
  Solutions.create(req.body, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find probid')); }

    console.log('Alternate solution received: ');
    console.log(req.body);
    res.status(200).json(req.body);
  });
});

router.delete('/comments/problem/:solutionid', auth, function(req, res, next) {
  if (req.payload.id != req.sol[0].staffid) {
    res.status(401).json({message: 'Unauthorized deletion of solution'});
  }
  Comments.remove({solutionid: req.sol[0].solutionid}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find solutionid')); }

    res.status(200).json({solutionid: req.sol[0].solutionid});
  });
});

// routes for staff members

router.get('/staff', auth, function(req, res, next) {
  Staff.find(function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find staff')); }

    console.log('Staff list requested');
    res.json(result);
  });
});

router.param('staffid', function(req, res, next, id) {
  Staff.find({staffid: id}, function(err, result) {
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
  Staff.update({staffid: req.staff.staffid},{type: req.body.type}, function(err, result) {
    if (err) { return next(err); }
    if (!result) { return next(new Error('can\'t find staffid')); }

    console.log('Staff account type of '+req.staff.staffid.toString()+' updated to '+req.body.type);
    res.status(200).json(req.body);
  });
});

module.exports = router
