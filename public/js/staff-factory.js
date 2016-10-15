app.factory('staff', ['$http', 'auth', function($http, auth) {
  var o = {
    staff: []
  };

  o.getAll = function () {
    return $http.get('/staff', {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
      angular.copy(data, o.staff);
    });
  }

  o.changeType = function (staffid, type) {
    return $http.put('/staff/type/'+staffid.toString(), {type: type}, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
      //
    });
  }

  return o;
}]);
