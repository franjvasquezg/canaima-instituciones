// Declare use of strict javascript
'use strict';


// Application -----------------------------------------------------------------

// nombre de la app, cambiar para nuevas aplicaciones, cambiando el nombre de la variable y el modulo

var profiles = angular.module('profiles',
    ['Tribs', 'User', 'infinite-scroll', 'ui.gravatar']);


// Events ----------------------------------------------------------------------

profiles.run(function($rootScope){
    $rootScope.$on('addNewTribsRefreshEmit', function(event, args){
        $rootScope.$broadcast('addNewTribsRefreshReceive', args);
    });
});


// Controllers -----------------------------------------------------------------

profiles.controller('CommentController', ['$scope', '$timeout', 'Tribs',
    CommentController]);
profiles.controller('NewTribController', ['$scope', '$timeout', 'Tribs',
    NewTribController]);
profiles.controller('TribListController', ['$scope', '$timeout', 'Tribs',
    TribListController]);
profiles.controller('UserController', ['$scope', 'User',
    UserController]);

function CommentController($scope, $timeout, Tribs){

}

function UserController($scope, User){    
    $scope.follow = function(){

        var user = User.query({author_username: 'luis'},
            function(){
                user[0].follows.push("/api/0.1/luis/profile");
                user[0].$modify({author_id: 3, author_username: 'luis'});
        });


        // var follow = User.modify({follows:[], author_id: 3},
        //     function(){
        //         console.log(follow);

        //         });
        // alert($scope.);
        // $scope.mensaje = "add as follow"

    }
}


function NewTribController($scope, $timeout, Tribs){

    $scope.createNewTrib = function(){

        var newtrib = {
            author_id: user_id,
            author_username: user_username,
            author_first_name: user_first_name,
            author_last_name: user_last_name,
            author_email: user_email,
            trib_content: $scope.trib_content,
            trib_pub_date: new Date().toISOString(),
            retribs: []
        };

        Tribs.save(newtrib, function(){
            $scope.trib_content = '';
            $scope.$emit('addNewTribsRefreshEmit', {});
        });
    };

    $scope.pollNewTribs = function() {
       $timeout(function() {
          $scope.$emit('addNewTribsRefreshEmit', {});
          $scope.pollNewTribs();
       }, 60000);
    };

    $scope.pollNewTribs();
}

function TribListController($scope, $timeout, Tribs){

    $scope.controller_busy = controller_busy;
    $scope.trib_limit_to = trib_limit_to;
    $scope.trib_limit = trib_limit;
    $scope.trib_offset = trib_offset;
    $scope.trib_orderby = trib_orderby;
    $scope.tribs = [];

    $scope.$on('addNewTribsRefreshReceive', function(event, args){
        $timeout(function(){
            $scope.addNewTribs($scope, $timeout, Tribs, trib_offset);
        });
    });

    $scope.addOldTribs = function(){

        if ($scope.tribs_end) return;

        if ($scope.controller_busy) return;

        $scope.controller_busy = true;

        var old_tribs = Tribs.query({
            order_by: $scope.trib_orderby,
            limit: $scope.trib_limit,
            offset: $scope.trib_offset
        }, function(){

            for(var i = 0; i < old_tribs.length; i++){
                var old_id_appears = false;

                for(var j = 0; j < $scope.tribs.length; j++){
                    if(old_tribs[i].id == $scope.tribs[j].id) old_id_appears = true;
                }

                if(!old_id_appears) $scope.tribs.push(old_tribs[i]);
            }

            if($scope.tribs.length > $scope.trib_offset){
                $scope.trib_offset = $scope.trib_offset + trib_add;
            }

            if($scope.tribs.length > $scope.trib_limit_to){
                $scope.trib_limit_to = $scope.tribs.length;
            }

            if(old_tribs.length === 0){
                $scope.tribs_end = true;
            }

            $timeout(function(){$('.trib_list').trigger('reload_dom');});
            $scope.controller_busy = false;
        });
    };

    $scope.addNewComment = function(){
        $scope.comment = "hola";
    }

    $scope.addNewTribs = function(){

        if ($scope.controller_busy) return;

        $scope.controller_busy = true;
        $scope.new_tribs_offset = trib_offset;
        $scope.first_trib_id = $scope.tribs[0].id;
        $scope.temp_new_tribs = [];

        var fresh_tribs = Tribs.query({
            order_by: $scope.trib_orderby,
            limit: $scope.trib_limit,
            offset: $scope.new_tribs_offset
        }, function(){

            for(var i = 0; i < fresh_tribs.length; i++){
                if(fresh_tribs[i].id != $scope.first_trib_id){
                    var fresh_id_appears = false;

                    for(var j = 0; j < $scope.tribs.length; j++){
                        if(fresh_tribs[i].id == $scope.tribs[j].id) fresh_id_appears = true;
                    }

                    if(!fresh_id_appears){
                        $scope.tribs.unshift(fresh_tribs[i]);

                        if($scope.tribs.length > $scope.trib_limit_to){
                            $scope.trib_limit_to = $scope.tribs.length;
                        }
                    }

                    if(i == (fresh_tribs.length-1)){
                        $scope.addNewTribs($scope, $timeout, Tribs, trib_offset+trib_add);
                    }

                } else {
                    break;
                }
            }

            $timeout(function(){$(".trib_list").trigger('reload_dom');});        
            $scope.controller_busy = false;
        });
    }
}
UserController.$inject     = ['$scope']; 
CommentController.$inject  = ['$scope'];
NewTribController.$inject  = ['$scope'];
TribListController.$inject = ['$scope'];


// Services --------------------------------------------------------------------

angular.module('Tribs', ['ngResource'])
    .factory('Tribs',  function($resource){
        return $resource('/api/0.1/user/tribs', {},{
            save: {
                method: 'POST',
                headers: {
                    'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
                },
            },
            query: {
                method: 'GET',
                isArray: true,
                transformResponse: function(data){
                    return angular.fromJson(data).objects;
                }
            },
            delete: {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
                },
            },
        });
    });

angular.module('User', ['ngResource'])
    .factory('User',  function($resource){
        return $resource('/api/0.1/:author_username/details/:author_id',
            { author_id: '@author_id', author_username: '@author_username' }, {
            save: {
                method: 'POST',
                headers: {
                    'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
                },
            },

            modify: {
                method: 'PATCH',
                headers: {
                    'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
                },
            },            
            query: {
                method: 'GET',
                isArray: true,
                transformResponse: function(data){
                    return angular.fromJson(data).objects;
                },
            },

            delete: {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
                },
            },
        });
    });    

