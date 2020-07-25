'use strict';
angular.module('main').controller('ReviewCtrl',
  function ($scope, $translate, Toast, $mdDialog, Review, Auth) {

    // Pagination options.
    $scope.rowOptions = [10, 20, 40];

    $scope.query = {
      limit: 5,
      page: 1,
      total: 0,
      status: null
    };

    $scope.reviews = [];

    var loadReviews = function () {
      Auth.ensureLoggedIn().then(function () {
        $scope.promise = Review.all($scope.query).then(function (reviews) {
          $scope.reviews = reviews;
          $scope.$apply();
        });
      });
    }

    loadReviews();

    var loadCount = function () {
      Auth.ensureLoggedIn().then(function () {
        Review.count($scope.query).then(function (total) {
          $scope.query.total = total;
          $scope.$apply();
        });
      });
    }

    loadCount();

    $scope.onPaginationChange = function (page, limit) {
      $scope.query.page = page;
      $scope.query.limit = limit;
      loadReviews();
    };

    $scope.onDelete = function (ev, review) {

      $translate(['DELETE', 'CONFIRM_DELETE', 'CONFIRM', 'CANCEL', 'DELETED']).then(function (str) {

        var confirm = $mdDialog.confirm()
          .title(str.DELETE)
          .textContent(str.CONFIRM_DELETE)
          .ariaLabel(str.DELETE)
          .ok(str.CONFIRM)
          .cancel(str.CANCEL);
        $mdDialog.show(confirm).then(function () {

          Review.destroy(review).then(function () {
            $translate('DELETED').then(function (str) {
              Toast.show(str);
            });
            loadReviews();
            loadCount();
          }, function (error) {
            Toast.show(error.message);
          });
        });

      });
    };

    $scope.onView = function (ev, obj) {
      $mdDialog.show({
        controller: DialogReviewController,
        templateUrl: '/views/partials/review.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true,
        locals: {
          obj: obj
        }
      });
    };

    function DialogReviewController($scope, $mdDialog, obj) {
      $scope.obj = obj;
      $scope.onClose = function () {
        $mdDialog.hide();
      };
    }

    $scope.onViewOrder = function (event, order) {

      $mdDialog.show({
        controller: 'DialogOrderViewController',
        scope: $scope.$new(),
        templateUrl: '/views/partials/order.html',
        parent: angular.element(document.body),
        locals: { order },
        clickOutsideToClose: false

      });
    };

    $scope.onChangeStatus = function (review, status) {
      review.status = status;
      Review.save(review).then(function () {
        $translate('SAVED').then(function (str) {
          Toast.show(str);
        });
      });
    };

    $scope.openMenu = function ($mdOpenMenu, ev) {
      $mdOpenMenu(ev);
    };

  }).directive('starRating', function () {

    return {
      restrict: 'EA',
      template: '<ul class="star-rating" ng-class="{readonly: readonly}">' +
        '  <li ng-repeat="star in stars" class="star" ng-class="{filled: star.filled}" ng-click="toggle($index)">' +
        '    <i class="fa fa-star">&#9733</i>' + // or &#9733
        '  </li>' +
        '</ul>',
      scope: {
        ratingValue: '=ngModel',
        max: '=?', // optional (default is 5)
        onRatingSelect: '&?',
        readonly: '=?'
      },
      link: function (scope, element, attributes) {
        if (scope.max == undefined) {
          scope.max = 5;
        }

        function updateStars() {
          scope.stars = [];
          for (var i = 0; i < scope.max; i++) {
            scope.stars.push({
              filled: i < scope.ratingValue
            });
          }
        };
        scope.toggle = function (index) {
          if (scope.readonly == undefined || scope.readonly === false) {
            scope.ratingValue = index + 1;
            scope.onRatingSelect({
              rating: index + 1
            });
          }
        };
        scope.$watch('ratingValue', function (oldValue, newValue) {
          if (newValue) {
            updateStars();
          }
        });
      }
    };
  });