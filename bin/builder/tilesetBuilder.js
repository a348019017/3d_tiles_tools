"use strict";
//模型分块和分层类，读取gltf中的模型并使用四叉树进行分块（暂无分层）
//生成3dtilset规范的模型瓦片tileset.json以及b3dm文件
//仅支持gltf来源的模型数据，暂不支持增量生成模式（监视文件夹中的数据变动，添加文件便增量，删除和修改一律重新建立瓦片）
Object.defineProperty(exports, "__esModule", { value: true });
//读取gltf文件并进行分块和创建3dtileset
const gltfContainer_1 = require("../gltfEx/gltfContainer");
const quadtree_1 = require("../quadtree");
const Cesium = require("cesium");
var Cartesian3 = Cesium.Cartesian3;
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var HeadingPitchRoll = Cesium.HeadingPitchRoll;
var Matrix4 = Cesium.Matrix4;
var Transforms = Cesium.Transforms;
class tilesetBuilder {
    ///filePath,传入的gltf文件名称，outDir，传出的文件夹名称
    static Builder(filePath, outDir) {
        //加载gltf文件，获取其所有子节点，建立四叉树，并添加所有节点    
        let container = gltfContainer_1.gltfContainerEx.readGltfByNode(filePath);
        let nodes = container ? container.Nodes : null;
        let maxExt = container ? container.MaxExtent : null;
        if (nodes && maxExt) {
            let quadTree = new quadtree_1.Quadtree(maxExt);
            nodes.forEach(node => {
                let nodeExt = container ? container.GetEnvelop3D(node) : null;
                if (nodeExt)
                    quadTree.insert(node, nodeExt);
            });
            //console.log(quadTree.Root);
            //先生成b3dm文件
            quadTree.traverse(node => {
                if (node.Contents.length != 0) {
                    //console.log(node);
                    let tmpgltf = new gltfContainer_1.gltfContainerEx();
                    node.Contents.forEach(ele => tmpgltf.AddNode(ele, container));
                    let outFileName = outDir + "\\" + node.Level + "_" + node.Morthon + ".gltf";
                    //+"_"+node.TileX+"_"+node.TileY+".gltf"   ;
                    //console.log(node.Contents); 
                    tmpgltf.SaveAsGLTF(outFileName, {});
                }
            });
        }
    }
    //将gltf转换成b3dm
    static createb3dm(node) {
    }
    //创建tileset文件
    static CreateTileset() {
        let root = {};
        root.asset = {};
        root.asset.version = 0.0;
        root.asset.tilesetVersion = 1.0;
        root.geometricError = 27596589.783091642;
    }
    static NodeToTileset(node) {
        if (!node)
            return null;
        let newset = {};
        newset.boundingVolume = [];
        //SSE的计算暂时以节点的边框的斜线除以500个像素为准，详细再作自定义
        newset.geometricError = Math.sqrt(node.Bounds.Width ^ 2 + node.Bounds.Long ^ 2) / 500.0;
        //经纬度宽度
        //对于城市这样大的范围并不能忽略地球曲率的影像，四叉树是按平面坐标划分，因此转换成经纬度坐标时势必存在偏移和旋转等问题
        //这里使用box作为范围而非region     
        newset.boundingVolume.box = node.Bounds.Center.concat([node.Bounds.Long / 2.0, 0, 0], [0, node.Bounds.Width / 2.0, 0], [0, 0, node.Bounds.Height / 2.0]);
        if (node.ContentEnvelope) {
            newset.content = {};
            newset.content.url = node.Tag;
            newset.content.boundingVolume = {};
            newset.content.boundingVolume.box = node.ContentEnvelope.Center.concat([node.ContentEnvelope.Long / 2.0, 0, 0], [0, node.ContentEnvelope.Width / 2.0, 0], [0, 0, node.ContentEnvelope.Height / 2.0]);
        }
        node.SubNodes.forEach(cNode => {
            let childSet = this.NodeToTileset(cNode);
            if (childSet)
                newset.children.push(childSet);
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
    static CreateGLTFByTreeNode() {
        //根据每个节点的
    }
}
//中心点坐标，即模型坐标的参考系0,0原点所对应的经纬度坐标
tilesetBuilder.centerCord = [];
exports.tilesetBuilder = tilesetBuilder;
class tilesetBuilderTest {
    static Test() {
        let curpath = "E:\\swyy\\TestFolder\\objTo3d-tiles\\test\\buildings\\output\\images\\buildings.gltf";
        let outDir = "E:\\swyy\\TestFolder\\objTo3d-tiles\\test\\buildings\\output\\images";
        tilesetBuilder.Builder(curpath, outDir);
    }
}
exports.tilesetBuilderTest = tilesetBuilderTest;
//# sourceMappingURL=tilesetBuilder.js.map