class Review extends Parse.Object {

  constructor() {
    super('Review');
  }

  get rating() {
    return this.get('rating');
  }

  set rating(val) {
    this.set('rating', val);
  }

  get comment() {
    return this.get('comment');
  }

  set comment(val) {
    this.set('comment', val);
  }

  get item() {
    return this.get('item');
  }

  set item(val) {
    this.set('item', val);
  }

  get order() {
    return this.get('order');
  }

  set order(val) {
    this.set('order', val);
  }

  get user() {
    return this.get('user');
  }

  set user(val) {
    this.set('user', val);
  }
}

Parse.Object.registerSubclass('Review', Review)

module.exports = Review