angular.module('main').factory('Brand', function ($q) {

  var Brand = Parse.Object.extend('Brand', {

    isActive: function () {
      return this.status === 'Active';
    },

    isInactive: function () {
      return this.status === 'Inactive';
    }

  }, {

      getInstance: function () {
        return this;
      },

      all: function (params) {

        var defer = $q.defer();
        var query = new Parse.Query(this);

        if (params && params.canonical) {
          query.contains('canonical', params.canonical);
        }

        if (params && params.limit && params.page) {
          query.limit(params.limit);
          query.skip((params.page * params.limit) - params.limit);
        }

        if (params && params.orderBy === 'asc') {
          query.ascending(params.orderByField);
        } else if (params && params.orderBy === 'desc') {
          query.descending(params.orderByField);
        } else {
          query.descending('createdAt');
        }


        //////////////

        var user = Parse.User.current();
        var brndarr = user.get("brands");
        
         
         const arr = [];
         if(brndarr)
         {
         if(brndarr.length >0)
         {console.log(brndarr);
         for (const brnd of brndarr)
         {

           arr.push(brnd.id)
         }


         query.containedIn('objectId',arr);

        }
      }
        //query.containedIn()
        ///////////////////

        query.doesNotExist('deletedAt');
        query.include('categories');

console.log(query);

        query.find().then(function (objs) {
          defer.resolve(objs);
        }, function (error) {
          defer.reject(error);
        })

        return defer.promise;

      },

      count: function (params) {

        var defer = $q.defer();
        var query = new Parse.Query(this);

        if (params && params.canonical) {
          query.contains('canonical', params.canonical);
        }

        query.doesNotExist('deletedAt');

        query.count().then(function (count) {
          defer.resolve(count);
        }, function (error) {
          defer.reject(error);
        })

        return defer.promise;

      },

      categories: function (params) {

        var defer = $q.defer();
        var query = new Parse.Query(this);

        query.equalTo('objectId',params.id)


        query.doesNotExist('deletedAt');

        query.find().then(function (cat) {
          defer.resolve(cat);
        }, function (error) {
          defer.reject(error);
        })

        return defer.promise;

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

      }

    });


  Object.defineProperty(Brand.prototype, 'name', {
    get: function () {
      return this.get('name');
    },
    set: function (val) {
      this.set('name', val);
    }
  });

  Object.defineProperty(Brand.prototype, 'status', {
    get: function () {
      return this.get('status');
    },
    set: function (val) {
      this.set('status', val);
    }
  });

  Object.defineProperty(Brand.prototype, 'deletedAt', {
    get: function () {
      return this.get('deletedAt');
    },
    set: function (val) {
      this.set('deletedAt', val);
    }
  });

  Object.defineProperty(Brand.prototype, 'image', {
    get: function () {
      return this.get('image');
    },
    set: function (val) {
      this.set('image', val);
    }
  });

  Object.defineProperty(Brand.prototype, 'imageThumb', {
    get: function () {
      return this.get('imageThumb');
    },
    set: function (val) {
      this.set('imageThumb', val);
    }
  });

  Object.defineProperty(Brand.prototype, 'categories', {
    get: function () {
      return this.get('categories');
    },
    set: function (val) {
      this.set('categories', val);
    }
  });

  

  return Brand;

});