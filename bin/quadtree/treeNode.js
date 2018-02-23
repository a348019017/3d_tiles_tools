"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envelop3D_1 = require("./envelop3D");
class TreeNode {
    constructor(env, level) {
        //morton码，用于计算最终的行列号
        this._morton = 0;
        /// <summary>
        /// The child nodes of the QuadTree
        /// /// <summary>
        /// subquads are numbered as follows:
        /// 2 | 3
        /// --+--
        /// 0 | 1
        /// </summary>
        this._nodes = new Array();
        //当前存储的节点内容
        this._contents = new Array();
        this._bounds = env;
        this._level = level;
        this._centerX = (env.MinX + env.MaxX) / 2;
        this._centerY = (env.MinY + env.MinY) / 2;
    }
    get Contents() {
        return this._contents;
    }
    get Morthon() {
        return this._morton;
    }
    set Morthon(v) {
        this._morton = v;
    }
    ///返回树的最大深度
    get Depth() {
        var maxSubDepth = 0;
        for (var index = 0; index < 4; index++) {
            var element = this._nodes[index];
            if (element != null) {
                let sqd = element.Depth;
                if (sqd > maxSubDepth) {
                    maxSubDepth = sqd;
                }
            }
        }
        return maxSubDepth + 1;
    }
    //获取和设置节点绑定的内容
    get Tag() {
        return this._tag;
    }
    set Tag(value) {
        this._tag = value;
    }
    get ContentEnvelope() {
        return this._contentEnvelope;
    }
    /* get TileX():number
    {
        let _x=0;
        for (var i = 0; i < 64; i=2) {
            _x+=((this._morton>>i)&1)<<(i/2);
        }
        return _x;
    } */
    /* get TileY():number
    {
        let _y=0;
        for (var i = 0; i <64; i+=2) {
            _y+=((this._morton>>i)&1)<<((i-1)/2);
        }
        return _y;
    } */
    get Level() {
        return this._level;
    }
    get SubNodes() {
        return this._nodes;
    }
    get Bounds() {
        return this._bounds;
    }
    //插入的代码写在QuadTree中，这里仅作基本的插入
    Insert(item, env) {
        //添加此节点内容
        this._contents.push(item);
        //扩大ContentBounds的范围
        if (!this._contentEnvelope) {
            this._contentEnvelope = env;
            return;
        }
        this.ContentEnvelope.ExpandToInclude(env);
    }
    InsertEx(item, env, callback) {
        //添加此节点内容
        this._contents.push(item);
        //扩大ContentBounds的范围
        if (!this._contentEnvelope) {
            this._contentEnvelope = env;
            return;
        }
        this.ContentEnvelope.ExpandToInclude(env);
        callback(this);
    }
    //根据指定的限制，确定待插入节点
    GetNode(env, maxLevel) {
        if (this._level >= maxLevel)
            return this;
        let subnodeIndex = this.GetSubnodeIndex(env);
        if (subnodeIndex != -1) {
            let node = this.SubNodes[subnodeIndex];
            if (node == null)
                node = this.CreateSubNode(subnodeIndex);
            return node.GetNode(env, maxLevel);
        }
        return this;
    }
    ///获取某个范围在此节点的哪个象限
    GetSubnodeIndex(env) {
        let subnodeIndex = -1;
        if (env.MinX >= this._centerX) {
            if (env.MinY >= this._centerY)
                subnodeIndex = 3;
            if (env.MaxY <= this._centerY)
                subnodeIndex = 1;
        }
        if (env.MaxX <= this._centerX) {
            if (env.MinY >= this._centerY)
                subnodeIndex = 2;
            if (env.MaxY <= this._centerY)
                subnodeIndex = 0;
        }
        return subnodeIndex;
    }
    //创建子节点
    CreateSubNode(index) {
        let minx = 0, maxx = 0, miny = 0, maxy = 0;
        switch (index) {
            case 0:
                minx = this._bounds.MinX;
                maxx = this._centerX;
                miny = this._bounds.MinY;
                maxy = this._centerY;
                break;
            case 1:
                minx = this._centerX;
                maxx = this._bounds.MaxX;
                miny = this._bounds.MinY;
                maxy = this._centerY;
                break;
            case 2:
                minx = this._bounds.MinX;
                maxx = this._centerX;
                miny = this._centerY;
                maxy = this._bounds.MaxY;
                break;
            case 3:
                minx = this._centerX;
                maxx = this._bounds.MaxX;
                miny = this._centerY;
                maxy = this._bounds.MaxY;
                break;
            default:
                break;
        }
        //向下划分时不能确定外包盒的高度，因此暂时指定为0，因此树构件完毕后其最大高度将于Cotent的高度相同
        let sqEnv = new envelop3D_1.Envelope3D(minx, maxx, miny, maxy, 0, 0);
        //子节点级别+1
        let nodes = new TreeNode(sqEnv, this._level + 1);
        this._nodes[index] = nodes;
        //计算morton码
        nodes.Morthon = (this._morton << 2) + index;
        return nodes;
    }
}
exports.TreeNode = TreeNode;
//# sourceMappingURL=treeNode.js.map