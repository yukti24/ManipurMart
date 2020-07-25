angular.module('main').factory('ItemVariation', function ($q) {

  var ItemVariation = Parse.Object.extend('ItemVariation', {}, {

    getInstance: function () {
      return this;
    },

    save: function (obj) {

      var defer = $q.defer();

      obj.save().then(function (obj) {
        defer.resolve(obj);
      }, function (error) {
        defer.reject(error);
      });

      return defer.promise;
    },

    delete: function (obj) {

      var defer = $q.defer();

      obj.deletedAt = new Date;
      obj.save().then(function (result) {
        defer.resolve(result);
      }, function (error) {
        defer.reject(error);
      });

      return defer.promise;

    },

    saveAll: function (objs) {

      var defer = $q.defer();

      Parse.Object.saveAll(objs, {
        success: function (result) {
          defer.resolve(result);
        },
        error: function (error) {
          defer.resolve(error);
        }
      });

      return defer.promise;
    }

  });

  Object.defineProperty(ItemVariation.prototype, 'name', {
    get: function () {
      return this.get('name');
    },
    set: function (val) {
      this.set('name', val);
    }
  });

  Object.defineProperty(ItemVariation.prototype, 'isActive', {
    get: function () {
      return this.get('isActive');
    },
    set: function (val) {
      this.set('isActive', val);
    }
  });

  return ItemVariation;

});