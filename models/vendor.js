class Vendor extends Parse.Object {
    
    constructor() {
        super('Vendor');
    }

    get name() {
        return this.get('name');
    }

    set name(val) {
        this.set('name', val);
    }

    get isApproved() {
        return this.get('isFeatured');
    }

    set isApproved(val) {
        this.set('isFeatured', val);
    }

    get status() {
        return this.get('status');
    }

    set status(val) {
        this.set('status', val);
    }

    get deletedAt() {
        return this.get('deletedAt');
    }

    set deletedAt(val) {
        this.set('deletedAt', val);
    }

    get brands() {
        return this.get('brands');
    }

    set brands(val) {
        this.set('brands', val);
    }

    get permissions() {
        return this.get('permissions');
    }

    set permissions(val) {
        this.set('permissions', val);
    }
}

Parse.Object.registerSubclass('Vendor', Vendor)

module.exports = Vendor