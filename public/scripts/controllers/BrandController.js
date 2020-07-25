angular.module('main')
  .controller('BrandListCtrl', function ($scope, $mdDialog, $translate, Brand, Toast, Auth) {

    $scope.rowOptions = [5, 10, 25];
    $scope.brands = [];
    $scope.isPrimary = false;

     const usr = Auth.getLoggedUser();

     const usrtype = Auth.getLoggedUser();

      $scope.isPrimary  = usr.isPrimary;
      $scope.type  = usr.type;
    $scope.query = {
      canonical: '',
      limit: 5,
      page: 1,
      total: 0,
    };

    $scope.onRefreshTable = function () {
      Auth.ensureLoggedIn().then(function () {
        $scope.promise = Brand.all($scope.query)
          .then(function (brands) {
            $scope.brands = brands;
          });
      });
    };

    $scope.onCountTable = function () {
      Auth.ensureLoggedIn().then(function () {
        $scope.promise = Brand.count($scope.query)
          .then(function (total) {
            $scope.query.total = total
          });
      });
    };

    $scope.onRefreshTable();
    $scope.onCountTable();

    $scope.onRefresh = function () {
      $scope.onRefreshTable();
      $scope.onCountTable();
    };

    $scope.onPaginationChange = function (page, limit) {
      $scope.query.page = page;
      $scope.query.limit = limit;
      $scope.onRefreshTable();
    };

    $scope.onReorder = function (field) {

      var indexOf = field.indexOf('-');
      var field1 = indexOf === -1 ? field : field.slice(1, field.length);
      $scope.query.orderBy = indexOf === -1 ? 'asc' : 'desc';
      $scope.query.orderByField = field1;
      $scope.onRefreshTable();
    };

    $scope.onChangeStatus = function (obj, status) {
      obj.status = status;
      Brand.save(obj).then(function () {
        $translate('SAVED').then(function (str) {
          Toast.show(str);
        });
        $scope.onRefreshTable();
        $scope.onCountTable();
      });

    };

    $scope.onEdit = function (event, obj) {

      $mdDialog.show({
        controller: 'DialogBrandController',
        scope: $scope.$new(),
        templateUrl: '/views/partials/brand.html',
        parent: angular.element(document.body),
        locals: { obj },
        clickOutsideToClose: false

      }).then(function (response) {
        if (response) {
          $scope.onRefreshTable();
          $scope.onCountTable();
        }
      });
    };

    $scope.onDelete = function (event, obj) {

      $translate(['DELETE', 'CONFIRM_DELETE', 'CONFIRM', 'CANCEL', 'DELETED'])
        .then(function (str) {

          var confirm = $mdDialog.confirm()
            .title(str.DELETE)
            .textContent(str.CONFIRM_DELETE)
            .ariaLabel(str.DELETE)
            .ok(str.CONFIRM)
            .cancel(str.CANCEL);

          $mdDialog.show(confirm).then(function () {

            Brand.delete(obj).then(function () {
              $translate('DELETED').then(function (str) {
                Toast.show(str);
              });
              $scope.onRefreshTable();
              $scope.onCountTable();
            }, function (error) {
              Toast.show(error.message)
            });
          });
        });
    }

  }).controller('DialogBrandController', function (Brand, Category, File, $scope, $translate, $mdDialog, Toast, obj) {

    $scope.obj = obj || new Brand;

    $scope.categories = $scope.obj.categories || [];

    $scope.queryCategories = function (query) {
      var query = query || '';
      return Category.all({
        canonical: query.toLowerCase(),
        orderBy: 'asc',
        orderByField: 'name',
        limit: 10,
      });
    };

    $scope.onClose = function () {
      if ($scope.obj.dirty()) $scope.obj.revert();
      $mdDialog.cancel();
    };

    $scope.uploadImage = function (file) {

      if (file) {

        $scope.isUploading = true;

        File.upload(file).then(function (savedFile) {
          $scope.obj.image = savedFile;
          $scope.isUploading = false;
          $translate('FILE_UPLOADED').then(function (str) {
            Toast.show(str);
          });

        }, function (error) {
          Toast.show(error.message);
          $scope.isUploading = false;
        });
      }
    }

    $scope.onSubmit = function (isFormValid) {

      if (!isFormValid) {
        return $translate('FILL_FIELDS').then(function (str) {
          Toast.show(str);
        });
      }

      $scope.isSaving = true;

      $scope.obj.categories = $scope.categories;

      Brand.save($scope.obj).then(function () {
        $scope.isSaving = false;
        $mdDialog.hide($scope.obj);
        $translate('SAVED').then(function (str) {
          Toast.show(str);
        });
      }, function (error) {
        $scope.isSaving = false;
        Toast.show(error.message);
      });
    };

  });