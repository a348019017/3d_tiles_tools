"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function map(obj, f) {
    return Object.keys(obj || {}).reduce((newObj, key) => {
        newObj[key] = f(obj[key], key);
        return newObj;
    }, {});
}
exports.map = map;
function* enumerate(obj) {
    for (let key of Object.keys(obj || {})) {
        yield [key, obj[key]];
    }
}
exports.enumerate = enumerate;
function first(obj) {
    return obj[Object.keys(obj)[0]];
}
exports.first = first;
//# sourceMappingURL=utils.js.map