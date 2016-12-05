app.factory('comments', ['$http', 'auth', 'socket', function($http, auth, socket) {
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
        socket.emit('comment',comment)
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

  o.deletecomm = function (commentid) {
    return $http.delete('/comments/problem/'+commentid, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data) {
      socket.emit('comment deleted', data)
    })
  }

  function deleteByCommentid (comments, commentid) {
    for (i in comments) {
      if (comments[i].commentid === commentid) {
        comments.splice(i,1)
        return
      }
    }
  }

  // problem deleted
  o.deleteComment = function (comm) {
    deleteByProbId(o.comments, comm.commentid)
  }

    // new comment added to bank
  o.newComment = function (comment) {
    o.comments.push(comment)
  }

  return o
}])
