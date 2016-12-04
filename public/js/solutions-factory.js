app.factory('solutions', ['$http', 'auth', 'socket', function($http, auth, socket) {
  var o = {
    solutions: []
  };

  o.create = function (solution) {
    return $http.post('/solutions', solution, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).then(
      function (res) {
        // success callback
        o.solutions.push(angular.copy(solution))
        socket.emit('solution',solution)
        // notify
        $rootScope.$broadcast('solutions:written')
      },
      function (res) {
        // failure callback @TODO
      }
    );
  };

  o.get = function (probid) {
    return $http.get('/solutions/problem/'+probid, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
      angular.copy(data, o.solutions);
    });
  }

  // new solution added to bank
  o.newSolution = function (solution) {
    o.solutions.push(solution)
  }

  return o;
}]);
