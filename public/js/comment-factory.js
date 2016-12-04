app.factory('comments', ['$http', 'auth', function($http, auth) {
  var o = {
    comments: []
  }

  o.create = function (comment) {
    return $http.post('/comments', comment, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).then(
      function (res) {
        // success callback
        o.comments.push(angular.copy(comment))
        socket.emit('comment',res)
        // notify
        $rootScope.$broadcast('comments:written')
      },
      function (res) {
        // failure callback @TODO
      }
    )
  }

  o.get = function (probid) {
    return $http.get('/comments/problem/'+probid, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data) {
      angular.copy(data, o.comments)
    })
  }

    // new comment added to bank
  o.newComment = function (comment) {
    o.comments.push(comment)
  }

  return o
}])
