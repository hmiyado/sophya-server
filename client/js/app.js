var app = angular.module('sophya', ['sophya.services']);

app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
        when('/', {
            templateUrl: 'room.html',
            controller: 'RoomController'
        }).when('/match', {
            templateUrl: 'match.html',
            controller: 'MatchController'
        }).when('/tutorial',{
            templateUrl: 'tutorial.html',
            controller: 'TutorialController'
        });
    }]);