angular.module('main').controller('ProfileCtrl',
    function ($scope, $translate, Auth, User, Toast,File) {

        $scope.user = Auth.getLoggedUser();


//console.log(scope.user)
       // $scope.notifications = [];
       $scope.uploadImage = function (file) {

        if (file) {
  
          $scope.isUploading = true;
  
          File.upload(file).then(function(savedFile) {
            $scope.user.photo = savedFile;
            $scope.isUploading = false;
            $scope.$apply();
          }, function(error) {
  
            Toast.show(error.message);
            $scope.isUploading = false;
            $scope.$apply();
          });
        }
      }
        
        $scope.onSubmit = function () {

            if ($scope.user.password && $scope.user.password.length < 6) {
                return $translate('PASSWORD_AT_LEAST_SIX_CHARACTERS').then(function(str) {
                  Toast.show(str);
                });
              }
        
              $scope.isSaving = true;
        
              User.save($scope.user).then(function(user) {
                $translate('SAVED').then(function(str) {
                  Toast.show(str);
                });

                req.session.user = user.toJSON()

                //$mdDialog.hide(user);
                $scope.isSaving = false;
                $scope.$apply();
              }, function(error) {
                Toast.show(error.message);
                $scope.isSaving = false;
                $scope.$apply();
              });
        }

    });