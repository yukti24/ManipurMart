class Item extends Parse.Object {

  constructor() {
    super('Item');
  }
}

Parse.Object.registerSubclass('Item', Item)

module.exports = Item