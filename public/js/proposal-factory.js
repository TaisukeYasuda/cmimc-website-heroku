app.factory('proposals', ['$http', '$rootScope', 'auth', 'socket', function($http, $rootScope, auth, socket) {
  var o = {
    probs: [],
    prob: [],
    bank: []
  };

  o.getAll = function () {
    return $http.get('/proposals/'+auth.staffId(), {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.probs);
    });
  };

  o.getBank = function () {
    return $http.get('/proposals/bank/', {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      angular.copy(data, o.bank);
    });
  };

  o.changeChecked = function (probid, checked) {
    return $http.put('/proposals/checked/'+probid, {checked: checked}, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
      //
    })
  }

  o.create = function (prob) {
    prob.checked = false;
    return $http.post('/proposals', prob, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).then(
      function (res) {
        // success callback
        o.probs.push(res)
        socket.emit('problem proposal',res)
        // notify
        $rootScope.$broadcast('problems:written')
      },
      function (res) {
        // failure callback
      }
    )
  }

  o.get = function (probid) {
    return $http.get('/proposals/problem/'+probid, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
      angular.copy(data, o.prob)
    })
  }

  o.put = function (probid, prob) {
    return $http.put('/proposals/problem/'+probid, prob, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
      //
    })
  }

  o.delete = function (probid) {
    return $http.delete('/proposals/problem/'+probid, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
      //
    })
  }

  o.newProb = function (proposal) {
    o.probs.push(proposal)
  }

  return o
}])
