app.factory('solutions', ['$http', 'auth', function($http, auth) {
  var o = {
    solutions: []
  };

  o.create = function (solution) {
    return $http.post('/solutions', solution, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).then(
      function (res) {
        // success callback
        o.solutions.push(angular.copy(solution));
      },
      function (res) {
        // failure callback
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

  return o;
}]);
