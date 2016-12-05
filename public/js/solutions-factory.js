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

  o.deletesol = function (solutionid) {
    return $http.delete('/solutions/problem/'+solutionid, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data) {
      socket.emit('solution deleted', data)
    })
  }

  function deleteBySolutionId (solutions, solutionid) {
    for (i in solutions) {
      if (solutions[i].solutionid === solutionid) {
        solutions.splice(i,1)
        return
      }
    }
  }

  // problem deleted
  o.deleteSolution = function (sol) {
    deleteBySolutionId(o.solutions, sol.solutionid)
  }

  return o;
}]);
