
import { Envelope3D } from "./envelop3D"
import { TreeNode } from "./treeNode"
/*
四叉树算法，对数据作二维的分割，由于处理3d的数据因此添加了高度的记录。
为了进行更好的封装，这里使用ts语言进行实现。
*/

export class Quadtree<T> {

  private _root: TreeNode<T>;

  get Root(): TreeNode<T> {
    return this._root;
  }


  constructor(totalEnvelop3D: Envelope3D,
    private _limits = { maxLevel: 10, maxShapesCount: 10 },
    private _level: number = 0) {
    //构造根节点,默认级别为0
    this._root = new TreeNode(totalEnvelop3D, 0);
  }


  public insert(item: T, env: Envelope3D): boolean {
    //结合限制树的最大高度（暂未考虑最大数量）查找当前范围适合插入的节点
    var destNode = this._root.GetNode(env, this._limits.maxLevel);
    destNode.Insert(item, env);
    return true;
  }

  public insertEx(item: T, env: Envelope3D, func: any): boolean {
    //结合限制树的最大高度（暂未考虑最大数量）查找当前范围适合插入的节点
    var destNode = this._root.GetNode(env, this._limits.maxLevel);
    destNode.InsertEx(item, env, func);
    return true;
  }


  public traverse(func: (node: TreeNode<T>) => void) {
    this.traverseChild(this.Root, func);
  }

  private traverseChild(treeNode: TreeNode<T>, func: (node: TreeNode<T>) => void) {
    if (treeNode) {
      func(treeNode);
      treeNode.SubNodes.forEach(ele => this.traverseChild(ele, func));
    }
  }




}