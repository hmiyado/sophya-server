'use strict';

var services = angular.module('sophya.services', []);

services.factory('socket', ['$rootScope', function ($rootScope) {
        var socket = io.connect();
        var room = null;

        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    })
                })
            },
            room: null,
            id: function(){return socket.id}
            
        }
    }]);

services.factory('game', [function () {
        var gameCondition = new GameCondition;
        return {
            start: function (playerName, opponentPlayerName, isFirstMover) {
                gameCondition.initialize(playerName, opponentPlayerName, isFirstMover);
            },
            end: function () {
                gameCondition.reset();
            },
            condition: gameCondition
        }
    }]);