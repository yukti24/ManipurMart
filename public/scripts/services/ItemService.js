angular.module('main').factory('Item', function () {

  var Item = Parse.Object.extend('Item', {

    initialize: function () {
      this.status = 'Active';
      this.images = [];
    }
  }, {
      new() {
        return new Item();
      },

      getInstance: function () {
        return this;
      },

      all: function (params) {

        var query = new Parse.Query(this);

        if (params && params.canonical) {
          query.contains('canonical', params.canonical);
        }
        
        if (params && params.status) {
          query.equalTo('status', params.status);
        }

        if (params && params.limit && params.page) {
          query.limit(params.limit);
          query.skip((params.page * params.limit) - params.limit);
        }

        if (params && params.orderBy == 'asc') {
          query.ascending(params.orderByField);
        } else if (params && params.orderBy == 'desc') {
          query.descending(params.orderByField);
        } else {
          query.descending('createdAt');
        }

        var user = Parse.User.current();
        var uid = user.id;
        var role = user.get("type");
        console.log(user);
        console.log(uid);
        if(role=="vendor"){
          query.equalTo('vendorid', uid);
        }
        
        query.include(['category', 'subcategory', 'variations', 'brand', 'relatedItems']);
        //query.doesNotExist('deletedAt');
       
        
        console.log(query);
        return query.find();

      },

      count: function (params) {

        var query = new Parse.Query(this);

        if (params && params.canonical) {
          query.contains('canonical', params.canonical);
        }

        if (params && params.status) {
          query.equalTo('status', params.status);
        }

        query.doesNotExist('deletedAt');

        return query.count();
      },

      save: function (obj) {
        return obj.save();
      },

      delete: function (obj) {
        obj.deletedAt = new Date;
        return obj.save();
      }

    });

  Object.defineProperty(Item.prototype, 'name', {
    get: function () {
      return this.get('name');
    },
    set: function (val) {
      this.set('name', val);
    }
  });

  Object.defineProperty(Item.prototype, 'description', {
    get: function () {
      return this.get('description');
    },
    set: function (val) {
      this.set('description', val);
    }
  });

  Object.defineProperty(Item.prototype, 'price', {
    get: function () {
      return this.get('price');
    },
    set: function (val) {
      this.set('price', val);
    }
  });

  Object.defineProperty(Item.prototype, 'salePrice', {
    get: function () {
      return this.get('salePrice');
    },
    set: function (val) {
      this.set('salePrice', val);
    }
  });

  Object.defineProperty(Item.prototype, 'category', {
    get: function () {
      return this.get('category');
    },
    set: function (val) {
      this.set('category', val);
    }
  });

  Object.defineProperty(Item.prototype, 'subcategory', {
    get: function () {
      return this.get('subcategory');
    },
    set: function (val) {
      this.set('subcategory', val);
    }
  });

  Object.defineProperty(Item.prototype, 'images', {
    get: function () {
      return this.get('images');
    },
    set: function (val) {
      this.set('images', val);
    }
  });

  Object.defineProperty(Item.prototype, 'status', {
    get: function () {
      return this.get('status');
    },
    set: function (val) {
      this.set('status', val);
    }
  });

  Object.defineProperty(Item.prototype, 'isFeatured', {
    get: function () {
      return this.get('isFeatured');
    },
    set: function (val) {
      this.set('isFeatured', val);
    }
  });

  Object.defineProperty(Item.prototype, 'isNewArrival', {
    get: function () {
      return this.get('isNewArrival');
    },
    set: function (val) {
      this.set('isNewArrival', val);
    }
  });

  Object.defineProperty(Item.prototype, 'featuredImage', {
    get: function () {
      return this.get('featuredImage');
    },
    set: function (val) {
      this.set('featuredImage', val);
    }
  });

  Object.defineProperty(Item.prototype, 'featuredImageThumb', {
    get: function () {
      return this.get('featuredImageThumb');
    },
    set: function (val) {
      this.set('featuredImageThumb', val);
    }
  });

  Object.defineProperty(Item.prototype, 'views', {
    get: function () {
      return this.get('views');
    },
    set: function (val) {
      this.set('views', val);
    }
  });

  Object.defineProperty(Item.prototype, 'deletedAt', {
    get: function () {
      return this.get('deletedAt');
    },
    set: function (val) {
      this.set('deletedAt', val);
    }
  });

  Object.defineProperty(Item.prototype, 'variations', {
    get: function () {
      return this.get('variations');
    },
    set: function (val) {
      this.set('variations', val);
    }
  });

  Object.defineProperty(Item.prototype, 'brand', {
    get: function () {
      return this.get('brand');
    },
    set: function (val) {
      this.set('brand', val);
    }
  });

  Object.defineProperty(Item.prototype, 'relatedItems', {
    get: function () {
      return this.get('relatedItems');
    },
    set: function (val) {
      this.set('relatedItems', val);
    }
  });

  Object.defineProperty(Item.prototype, 'tags', {
    get: function () {
      return this.get('tags');
    },
    set: function (val) {
      this.set('tags', val);
    }
  });

  Object.defineProperty(Item.prototype, 'vendorid', {
    get: function () {
      return this.get('vendorid');
    },
    set: function (val) {
      this.set('vendorid', val);
    }
  });

  Object.defineProperty(Item.prototype, 'ratingAvg', {
    get: function () {
      return this.get('ratingAvg');
    },
    set: function (val) {
      this.set('ratingAvg', val);
    }
  });

  return Item;

});