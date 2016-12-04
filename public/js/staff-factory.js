app.factory('staff', ['$http', 'auth', 'socket', function($http, auth, socket) {
  var o = {
    staff: []
  };

  o.getAll = function () {
    return $http.get('/staff', {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data) {
      angular.copy(data, o.staff)
    });
  }

  o.changeType = function (staffid, type) {
    $http.put('/staff/type/'+staffid.toString(), {type: type}, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data) {
        data.staffid = staffid
        socket.emit('staff type update', data)
      })
  }

  return o
}])
