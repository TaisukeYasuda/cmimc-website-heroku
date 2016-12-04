app.controller('authCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.signup = function () {
    auth.signup($scope.user).error(function(error){
      $scope.error = error
    }).then(function() {
      $state.go('proposals')
    })
  }

  $scope.login = function () {
    auth.login($scope.user).error(function(error){
      $scope.error = error
    }).then(function() {
      $state.go('proposals')
    })
  }
}])

app.controller('navCtrl', [
'$scope',
'$rootScope',
'$state',
'$stateParams',
'auth',
'proposals',
'comments',
'solutions',
'socket',
function($scope, $rootScope, $state, $stateParams, auth, proposals, comments, solutions, socket){
  // get info by calling isLoggedIn() and currentUser()
  $scope.isLoggedIn = auth.isLoggedIn
  $scope.currentUser = auth.currentUser
  $scope.accountType = auth.accountType
  $scope.staffId = auth.staffId
  $scope.logOut = auth.logOut

  socket.on('staff type update', function (update) {
    if (update.staffid === auth.staffId()) {
      auth.saveToken(update.jwt)
      if ($state.current.url === '/prob-bank' ||
          $state.current.url === '/manage-users' ||
          $state.current.url === '/manage-contest') {
        $state.go($state.current, {}, {reload: true})
      }
    }
  })

  socket.on('problem proposal', function (proposal) {
    proposals.newProb(proposal)
    if (proposal.staffid === auth.staffId()) {
      proposals.myProb(proposal)
    }
  })

  socket.on('proposal deleted', function (proposal) {
    proposals.deleteProb(proposal)
    if (proposal.staffid === auth.staffId()) {
      proposals.deleteMyProb(proposal)
    }
  })

  socket.on('comment', function (comment) {
    if ($stateParams.id == comment.probid) {
      comments.newComment(comment)
    }
  })

  socket.on('solution', function (solution) {
    if ($stateParams.id === solution.probid) {
      solutions.newSolution(solution)
    }
  })
}])

app.controller('proposeCtrl', [
'$scope',
'$state',
'$http',
'auth',
'proposals',
function ($scope, $state, $http, auth, proposals) {
  // submit:
  // INSERT INTO proposals (staffid, topic, problem, answer, solution, difficulty) VALUES ()
  $scope.staffid = auth.staffId()

  // triggered by proposals.create(prob) if successful
  $scope.$on('problems:written', function(event, data) {
    $state.go('proposals', {}, {reload: true})
  })

  $scope.submit = function() {
    var prob = $scope.prob
    prob.staffid = auth.staffId()
    prob.staffname = auth.currentUser()
    proposals.create(prob)
  }
}])

app.controller('manageContestCtrl', [
'$scope',
'proposals',
function ($scope, proposals) {
  $scope.bank = proposals.bank
  $scope.changeChecked = proposals.changeChecked
}])

app.controller('manageUsersCtrl', [
'$scope',
'staff',
'auth',
function ($scope, staff, auth) {
  $scope.staff = staff.staff
  $scope.changeType = staff.changeType
  $scope.staffId = auth.staffId
}])

app.controller('probBankCtrl', [
'$scope',
'$http',
'proposals',
function ($scope, $http, proposals) {
  $scope.$on('problems:updated', function(event, proposal) {
    $scope.$apply()
  })

  $scope.bank = proposals.bank
}])

app.controller('myProposalsCtrl', [
'$scope',
'$http',
'proposals',
function ($scope, $http, proposals) {
  $scope.$on('problems:updated', function(event, proposal) {

  })

  $scope.probs = proposals.probs
}])

app.controller('viewProbCtrl', [
'$scope',
'$state',
'$stateParams',
'auth',
'proposals',
'comments',
'solutions',
function ($scope, $state, $stateParams, auth, proposals, comments, solutions) {
  $scope.comments = comments.comments
  $scope.solutions = solutions.solutions

  var p = proposals.prob
  if (p == []) {
    $state.go('proposals') //@TODO go to an error message
  } else {
    $scope.prob = proposals.prob[0];
    $scope.revealIdentity = function() {
      document.getElementById("prob-author").innerHTML = $scope.prob.staffid
      document.getElementById("prob-author").removeAttribute("href")
    }
  }

  $scope.submitComment = function () {
    $scope.comment.staffid = auth.staffId()
    $scope.comment.probid = $scope.prob.probid
    comments.create(angular.copy($scope.comment))
    $scope.comment.comment = ''
  }

  $scope.submitSolution = function () {
    $scope.solution.staffid = auth.staffId()
    $scope.solution.probid = $scope.prob.probid
    solutions.create(angular.copy($scope.solution))
    $scope.solution.solution = ''
  }
}])

app.controller('editProbCtrl', [
'$scope',
'$state',
'$location',
'proposals',
function ($scope, $state, $location, proposals) {
  var p = proposals.prob
  if (p == []) {
    $state.go('proposals') //@TODO go to an error message
  } else {
    p = p[0]
    p.difficulty = p.difficulty.toString()
    $scope.prob = p
  }

  $scope.put = function () {
    proposals.put(p.probid, p)
    $location.path('proposals')
  }

  $scope.delete = function () {
    proposals.delete(p.probid)
    $location.path('proposals')
  }
}])

app.controller('homeCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn
  $scope.currentUser = auth.currentUser
  $scope.accountType = auth.accountType
}])
