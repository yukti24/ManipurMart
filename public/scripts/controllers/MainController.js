'use strict';

angular.module('main')
  .controller('MainCtrl', function ($rootScope, $scope, $mdSidenav, $window,
    $translate, $localStorage, $mdDialog, $interval, Toast, Auth, Order) {

    $scope.onChangeLang = function (lang) {
      $localStorage.lang = lang;
      $translate.use(lang);
    };

    $scope.openMenu = function ($mdOpenMenu, ev) {
      $mdOpenMenu(ev);
    };

    $scope.toggle = function () {
      $mdSidenav('leftMenu').toggle();
    };

    var loadOrderCount = function () {

      Auth.ensureLoggedIn().then(function (user) {

        if (user.hasPermission('orders')) {
          Order.count({ isMarkedAsSeen: false }).then(function (count) {

            $scope.orderCount = count;
            $scope.$apply();

            if (count) {

              $translate('YOU_HAVE_NEW_ORDERS', { count }, 'messageformat')
                .then(function (str) {
                  Toast.show(str);
                });

              var audio = new Audio('/audio/notify.mp3');
              audio.play();
            }
          });
        }
      });
    };

    loadOrderCount();

    var intervalId = $interval(loadOrderCount, 15000);

    var onFocus = function () {
      if (!intervalId) {
        intervalId = $interval(loadOrderCount, 15000);
      }
    };

    var onBlur = function () {
      if (intervalId) {
        $interval.cancel(intervalId);
        intervalId = undefined;
      }
    };

    $window.onfocus = onFocus;
    $window.onblur = onBlur;

    $scope.onPresentAppConfigView = function (ev) {

      $mdDialog.show({
        controller: 'AppConfigCtrl',
        templateUrl: '/views/partials/app-config.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true
      });
    };

    $rootScope.currentUser = Auth.getLoggedUser();

    $rootScope.isLoggedIn = function () {
      return $rootScope.currentUser !== null;
    };

    $scope.onChangePassword = function (ev) {

      $mdDialog.show({
        controller: 'ChangePasswordController',
        templateUrl: '/views/partials/change-password.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true
      });
    };

  }).controller('ChangePasswordController', function ($scope, Toast, $mdDialog, $translate, User, Auth) {

    $scope.formData = {};

    $scope.user = Auth.getLoggedUser();

    $scope.onSave = function () {

      if ($scope.formData.newPassword !== $scope.formData.confirmedPassword) {
        $translate('PASSWORD_DOESNT_MATCH').then(function (str) {
          Toast.show(str);
        });
        return;
      }

      if ($scope.formData.newPassword.length < 6) {
        $translate('PASSWORD_AT_LEAST_SIX_CHARACTERS').then(function (str) {
          Toast.show(str);
        });
        return;
      }

      $scope.isSaving = true;

      Auth.logIn($scope.user.getUsername(), $scope.formData.oldPassword)
        .then(function () {
          $scope.user.password = $scope.formData.newPassword;
          return User.save($scope.user);
        }).then(function () {
          $translate('SAVED').then(function (str) {
            Toast.show(str);
          });
          $scope.onClose();
          $scope.isSaving = false;
        }, function () {
          $translate('CURRENT_PASS_INVALID').then(function (str) {
            Toast.show(str);
          });
          $scope.isSaving = false;
        });
    };

    $scope.onClose = function () {
      $mdDialog.cancel();
    };

  });