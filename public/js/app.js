var app = angular.module('mainApp', ['ui.router']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '',
      controller: 'homeCtrl',
      templateUrl: 'templates/home.html'
    })
    .state('manage-users', {
      url: '/manage-users',
      controller: 'manageUsersCtrl',
      templateUrl: 'templates/manage-users.html',
      resolve: {
        staffPromise: ['staff', function(staff){
          return staff.getAll();
        }]
      }
    })
    .state('manage-contest', {
      url: '/manage-contest',
      controller: 'manageContestCtrl',
      templateUrl: 'templates/manage-contest.html',
      resolve: {
        bankPromise: ['proposals', function(proposals){
          return proposals.getBank();
        }]
      }
    })
    .state('prob-bank', {
      url: '/prob-bank',
      controller: 'probBankCtrl',
      templateUrl: 'templates/prob-bank.html',
      resolve: {
        bankPromise: ['proposals', function(proposals){
          return proposals.getBank();
        }]
      }
    })
    .state('proposals', {
      url: '/proposals',
      templateUrl: 'templates/proposals.html',
      controller: 'myProposalsCtrl',
      resolve: {
        postPromise: ['proposals', function(proposals){
          return proposals.getAll();
        }]
      }
    })
    .state('access-denied', {
      url: '/access-denied',
      templateUrl: 'templates/access-denied.html'
    })
    .state('edit-prob', {
      url: '/edit-prob/{id}',
      templateUrl: 'templates/edit-prob.html',
      controller: 'editProbCtrl',
      resolve: {
        prob: ['$stateParams', 'proposals', function($stateParams, proposals) {
          return proposals.get($stateParams.id);
        }]
      }
    })
    .state('view-prob', {
      url: '/view-prob/{id}',
      templateUrl: 'templates/view-prob.html',
      controller: 'viewProbCtrl',
      resolve: {
        prob: ['$stateParams', 'proposals', function($stateParams, proposals) {
          return proposals.get($stateParams.id);
        }],
        commentsPromise: ['$stateParams', 'comments', function($stateParams, comments) {
          return comments.get($stateParams.id);
        }],
        solutionsPromise: ['$stateParams', 'solutions', function($stateParams, solutions) {
          return solutions.get($stateParams.id);
        }]
      }
    })
    .state('propose', {
      url: '/propose',
      templateUrl: 'templates/propose.html',
      controller: 'proposeCtrl'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'authCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
        if (auth.isLoggedIn()) {
          $state.go('propose');
        }
      }]
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'templates/signup.html',
      controller: 'authCtrl'
    })
    .state('error', {
      url: '/error',
      templateUrl: 'templates/404.html'
    })
    .state('logged-out', {
      url: '/logged-out',
      templateUrl: 'templates/logged-out.html',
      onEnter: ['$state', 'auth', function ($state, auth) {
        if (auth.isLoggedIn()) {
          auth.logout()
        }
      }]
    });

  $urlRouterProvider.otherwise('error');
}]);
