'use strict';
angular.module('main').factory('Review', function () {

  var Review = Parse.Object.extend('Review', {

  }, {

    save: function (obj) {
      return obj.save();
    },

    destroy: function (obj) {
      return obj.destroy();
    },

    count: function () {
      var query = new Parse.Query(this);
      return query.count();
    },

    all: function (params) {

      var query = new Parse.Query(this);

      query.descending('createdAt');
      query.include(['user', 'item', 'order']);
      query.limit(params.limit);
      query.skip((params.page * params.limit) - params.limit);
      return query.find();
    },

  });

  Object.defineProperty(Review.prototype, 'user', {
    get: function () {
      return this.get('user');
    }
  });

  Object.defineProperty(Review.prototype, 'item', {
    get: function () {
      return this.get('item');
    }
  });

  Object.defineProperty(Review.prototype, 'comment', {
    get: function () {
      return this.get('comment');
    }
  });

  Object.defineProperty(Review.prototype, 'rating', {
    get: function () {
      return this.get('rating');
    }
  });

  Object.defineProperty(Review.prototype, 'order', {
    get: function () {
      return this.get('order');
    }
  });

  Object.defineProperty(Review.prototype, 'status', {
    get: function () {
      return this.get('status');
    },
    set: function (val) {
      this.set('status', val);
    }
  });

  return Review;

});