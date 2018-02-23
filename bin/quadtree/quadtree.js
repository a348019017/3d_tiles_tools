"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const treeNode_1 = require("./treeNode");
/*
四叉树算法，对数据作二维的分割，由于处理3d的数据因此添加了高度的记录。
为了进行更好的封装，这里使用ts语言进行实现。
*/
class Quadtree {
    constructor(totalEnvelop3D, _limits = { maxLevel: 10, maxShapesCount: 10 }, _level = 0) {
        this._limits = _limits;
        this._level = _level;
        //构造根节点,默认级别为0
        this._root = new treeNode_1.TreeNode(totalEnvelop3D, 0);
    }
    get Root() {
        return this._root;
    }
    insert(item, env) {
        //结合限制树的最大高度（暂未考虑最大数量）查找当前范围适合插入的节点
        var destNode = this._root.GetNode(env, this._limits.maxLevel);
        destNode.Insert(item, env);
        return true;
    }
    insertEx(item, env, func) {
        //结合限制树的最大高度（暂未考虑最大数量）查找当前范围适合插入的节点
        var destNode = this._root.GetNode(env, this._limits.maxLevel);
        destNode.InsertEx(item, env, func);
        return true;
    }
    traverse(func) {
        this.traverseChild(this.Root, func);
    }
    traverseChild(treeNode, func) {
        if (treeNode) {
            func(treeNode);
            treeNode.SubNodes.forEach(ele => this.traverseChild(ele, func));
        }
    }
}
exports.Quadtree = Quadtree;
//# sourceMappingURL=quadtree.js.map