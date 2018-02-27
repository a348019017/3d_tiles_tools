"use strict";
//模型分块和分层类，读取gltf中的模型并使用四叉树进行分块（暂无分层）
//生成3dtilset规范的模型瓦片tileset.json以及b3dm文件
//仅支持gltf来源的模型数据，暂不支持增量生成模式（监视文件夹中的数据变动，添加文件便增量，删除和修改一律重新建立瓦片）
Object.defineProperty(exports, "__esModule", { value: true });
//读取gltf文件并进行分块和创建3dtileset
const gltfContainer_1 = require("../gltfEx/gltfContainer");
const quadtree_1 = require("../quadtree");
const Cesium = require("cesium");
const fs = require("fs-extra");
const combineTilesets = require("./combineTileset");
var Cartesian3 = Cesium.Cartesian3;
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var HeadingPitchRoll = Cesium.HeadingPitchRoll;
var Matrix4 = Cesium.Matrix4;
var Transforms = Cesium.Transforms;
class tilesetBuilder {
    ///filePath,传入的gltf文件名称，outDir，传出的文件夹名称
    static Builder(filePath, outDir, options = {}) {
        //加载gltf文件，获取其所有子节点，建立四叉树，并添加所有节点    
        let container = gltfContainer_1.gltfContainerEx.readGltfByNode(filePath);
        let nodes = container ? container.Nodes : null;
        let maxExt = container ? container.MaxExtent : null;
        if (nodes && maxExt) {
            try {
                let quadTree = new quadtree_1.Quadtree(maxExt, { maxLevel: 5, maxShapesCount: 10 });
                nodes.forEach(node => {
                    let nodeExt = container ? container.GetEnvelop3D(node) : null;
                    if (nodeExt)
                        quadTree.insert(node, nodeExt);
                });
                //先生成b3dm文件
                quadTree.traverse(node => {
                    if (node && node.Contents.length != 0) {
                        //console.log(node);
                        let tmpgltf = new gltfContainer_1.gltfContainerEx(null, container ? container.FileName : undefined);
                        node.Contents.forEach(ele => tmpgltf.AddNode(ele, container));
                        //let outFileName = outDir + "\\" + node.Level + "_" + node.Morthon + ".b3dm";
                        //let outFileName1 = outDir + "\\" + node.Level + "_" + node.Morthon + ".gltf";
                        let outFileName2 = outDir + "\\" + node.Level + "_" + node.Morthon + ".b3dm";
                        //+"_"+node.TileX+"_"+node.TileY+".gltf"   ;
                        //console.log(node.Contents);                
                        //tmpgltf.SaveAs(outFileName);
                        tmpgltf.SaveAs(outFileName2);
                        //同时保存一个白膜版本
                        node.Tag = { normal: node.Level + "_" + node.Morthon + ".b3dm" };
                        if (this._option.defaultMaterial) {
                            let outFileNameSimple = outDir + "\\" + node.Level + "_" + node.Morthon + "_x" + ".b3dm";
                            tmpgltf.SaveAs(outFileNameSimple, { embedImage: false, defaultMaterial: true });
                            node.Tag.simple = node.Level + "_" + node.Morthon + "_x" + ".b3dm";
                        }
                    }
                });
                //再生成瓦片数据
                let tileset = this.CreateTileset(quadTree.Root);
                //写入tileset
                let outtilesetPath = outDir + "\\" + "tileset.json";
                fs.writeJsonSync(outtilesetPath, tileset);
                console.log("瓦片生成成功！");
            }
            catch (error) {
                console.log("瓦片生成失败！");
            }
            return;
        }
        console.log("原始数据存在问题，无法正确分块！");
    }
    //对于已经分区好的数据可以单独编译并融合多个tileset为一个
    static MBuilder(filePath, outDir, options = {}) {
    }
    //融合文件夹中的多个Tileset
    static CombineTileset(inputDir) {
        let option = { inputDir: inputDir };
        combineTilesets(option).then(outInfo => {
            let tileset = outInfo.tileset;
            let outputfile = outInfo.output;
            fs.writeJsonSync(outputfile, tileset);
        });
    }
    ///追加编译，由于模型的数量多，可能又有变动，因此需要动态的追加编译
    //Q1 追加的模型会使得四叉树发生变化，因此部分节点仍然需要重新创建，功能较为麻烦滞后处理
    static BuilderAdditional() {
    }
    //创建tileset文件
    static CreateTileset(rootNode) {
        if (this._option.isbottom) {
            this.centerCord[2] = -rootNode._bounds.MinZ;
        }
        ;
        let root = {};
        root.asset = {};
        root.asset.version = "0.0";
        root.asset.tilesetVersion = "1.0";
        //默认设置Z坐标向上
        root.asset.gltfUpAxis = 'Z';
        root.geometricError = this._option.startSSE;
        root.root = this.NodeToTileset(rootNode);
        //设置变换矩阵,这里的高度并没有考虑变换，因此后期可能需要调整和地形的关系
        let transform = this.wgs84Transform(this.centerCord[0], this.centerCord[1], this.centerCord[2]);
        var transformArray = (defined(transform) && !Matrix4.equals(transform, Matrix4.IDENTITY)) ? Matrix4.pack(transform, new Array(16)) : undefined;
        root.root.transform = transformArray;
        root.root.refine = "REPLACE";
        return root;
    }
    //评估SSE
    static evaluateSSE(node) {
        if (!node)
            return null;
        return Math.sqrt(node.Bounds.Width * node.Bounds.Width + node.Bounds.Long * node.Bounds.Long + node.Bounds.Height * node.Bounds.Height) / 20.0;
    }
    static NodeToTileset(node) {
        if (!node)
            return null;
        let newset = {};
        newset.boundingVolume = {};
        //SSE的计算暂时以节点的边框的斜线除以500个像素为准，详细再作自定义
        newset.geometricError = this.evaluateSSE(node);
        newset.refine = "REPLACE";
        //经纬度宽度
        //对于城市这样大的范围并不能忽略地球曲率的影像，四叉树是按平面坐标划分，因此暂时使用box作为boundingVolume
        //这里使用box作为范围而非region     
        newset.boundingVolume.box = node.Bounds.Center.concat([node.Bounds.Long / 2.0, 0, 0], [0, node.Bounds.Width / 2.0, 0], [0, 0, node.Bounds.Height / 2.0]);
        if (node.ContentEnvelope) {
            newset.content = {};
            newset.content.url = node.Tag.normal;
            newset.content.boundingVolume = {};
            newset.content.boundingVolume.box = node.ContentEnvelope.Center.concat([node.ContentEnvelope.Long / 2.0, 0, 0], [0, node.ContentEnvelope.Width / 2.0, 0], [0, 0, node.ContentEnvelope.Height / 2.0]);
        }
        if (this._option.defaultMaterial) {
            let lodset = {};
            lodset.refine = "REPLACE";
            lodset.boundingVolume = newset.boundingVolume;
            lodset.geometricError = newset.geometricError / 2;
            if (newset.content) {
                lodset.content = {};
                newset.content.url = node.Tag.simple;
                lodset.content.url = node.Tag.normal;
                lodset.content.boundingVolume = newset.content.boundingVolume;
            }
            !newset.children ? newset.children = [] : null;
            newset.children.push(lodset);
        }
        node.SubNodes.forEach(cNode => {
            let childSet = this.NodeToTileset(cNode);
            if (childSet) {
                if (!newset.children)
                    newset.children = [];
                newset.children.push(childSet);
            }
            ;
        });
        return newset;
    }
    //距离转换成经纬度距离
    static metersToLongitude(meters, latitude) {
        return meters * 0.000000156785 / Math.cos(latitude);
    }
    static metersToLatitude(meters) {
        return meters * 0.000000157891;
    }
    //变换矩阵，使得gltf文件能在cesium里面正常显示
    static wgs84Transform(longitude, latitude, height) {
        return Transforms.headingPitchRollToFixedFrame(Cartesian3.fromRadians(longitude, latitude, height), new HeadingPitchRoll());
    }
}
//中心点坐标，即模型坐标的参考系0,0原点所对应的经纬度坐标
tilesetBuilder.centerCord = [-1.31968, 0.698874, 0];
//生成瓦片的一系列参数
//@isbottom 是否贴地，在不考虑地形的情况下，将模型置于地面
//@startSSE  起始的GeometryErr值
tilesetBuilder._option = { isbottom: true, startSSE: 100, defaultMaterial: true };
exports.tilesetBuilder = tilesetBuilder;
//额外的设置
class ExtraSetting {
    constructor() {
        //默认材质也就是白膜的材质样式记录
        this._defaultMaterial = {
            "pbrMetallicRoughness": {
                "baseColorFactor": [
                    1.0,
                    1.0,
                    1.0,
                    1.0
                ],
                "metallicFactor": 0.0
            },
            "emissiveFactor": [
                0.0,
                0.0,
                0.0
            ],
            "name": "_1_-_Default"
        };
    }
}
exports.ExtraSetting = ExtraSetting;
class tilesetBuilderTest {
    static Test() {
        //let curpath="E:\\swyy\\TestFolder\\objTo3d-tiles\\test\\buildings\\output\\images\\buildings.gltf";
        //let outDir="E:\\swyy\\TestFolder\\objTo3d-tiles\\test\\buildings\\output\\images"     
        let curpath = "F:\\modeldata\\a01gltf\\output\\a01.gltf";
        let outDir = "F:\\modeldata\\a01gltf\\output";
        tilesetBuilder.Builder(curpath, outDir);
    }
}
exports.tilesetBuilderTest = tilesetBuilderTest;
//# sourceMappingURL=tilesetBuilder.js.map