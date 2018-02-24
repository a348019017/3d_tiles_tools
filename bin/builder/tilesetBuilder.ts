//模型分块和分层类，读取gltf中的模型并使用四叉树进行分块（暂无分层）
//生成3dtilset规范的模型瓦片tileset.json以及b3dm文件
//仅支持gltf来源的模型数据，暂不支持增量生成模式（监视文件夹中的数据变动，添加文件便增量，删除和修改一律重新建立瓦片）

//读取gltf文件并进行分块和创建3dtileset
import {gltfContainerEx,gltfWriterOptions} from "../gltfEx/gltfContainer"
import {Envelope3D,Quadtree,TreeNode} from "../quadtree"
import Cesium = require('cesium'); 
import * as fs from "fs-extra"
import * as combineTilesets from "./combineTileset"

var Cartesian3 = Cesium.Cartesian3;
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var HeadingPitchRoll = Cesium.HeadingPitchRoll;
var Matrix4 = Cesium.Matrix4;
var Transforms = Cesium.Transforms;

export class tilesetBuilder
{
      //中心点坐标，即模型坐标的参考系0,0原点所对应的经纬度坐标
      private static centerCord:any=[-1.31968,0.698874,0];


      ///filePath,传入的gltf文件名称，outDir，传出的文件夹名称
      public  static  Builder(filePath: string, outDir: string,options:any={}): void {
            //加载gltf文件，获取其所有子节点，建立四叉树，并添加所有节点    
            let container = gltfContainerEx.readGltfByNode(filePath);
            let nodes = container ? container.Nodes : null;
            let maxExt = container ? container.MaxExtent : null;
            if (nodes && maxExt) {
                  try {
                        let quadTree = new Quadtree<any>(maxExt,{maxLevel:3,maxShapesCount:10});
                        nodes.forEach(node => {
                              let nodeExt = container ? container.GetEnvelop3D(node) : null;
                              if (nodeExt) quadTree.insert(node, nodeExt);
                        });
                        //先生成b3dm文件
                        quadTree.traverse(node => {
                              if (node.Contents.length != 0) {
                                    //console.log(node);
                                    let tmpgltf = new gltfContainerEx();
                                    node.Contents.forEach(ele => tmpgltf.AddNode(ele, container));
                                    //let outFileName = outDir + "\\" + node.Level + "_" + node.Morthon + ".b3dm";
                                    //let outFileName1 = outDir + "\\" + node.Level + "_" + node.Morthon + ".gltf";
                                    let outFileName2 = outDir + "\\" + node.Level + "_" + node.Morthon + ".b3dm";
                                    //+"_"+node.TileX+"_"+node.TileY+".gltf"   ;
                                    //console.log(node.Contents);                
                                    //tmpgltf.SaveAs(outFileName);
                                     tmpgltf.SaveAs(outFileName2);
                                    //tmpgltf.SaveAs(outFileName2);
                                    node.Tag=node.Level + "_" + node.Morthon + ".b3dm";
                              }
                        });
                        //再生成瓦片数据
                        let tileset= this.CreateTileset(quadTree.Root);
                        //写入tileset
                        let outtilesetPath=outDir+"\\"+"tileset.json";
                        fs.writeJsonSync(outtilesetPath,tileset);
                        console.log("瓦片生成成功！");
                  } catch (error) {
                        console.log("瓦片生成失败！")
                  }
                  return ;
            }
            console.log("原始数据存在问题，无法正确分块！");
      }

      //对于已经分区好的数据可以单独编译并融合多个tileset为一个
      public static MBuilder(filePath: string[],outDir:string,options:any={}):void
      {
            
      }

      //融合文件夹中的多个Tileset
      public static CombineTileset(inputDir:string)
      {
            let option={inputDir:inputDir};
            combineTilesets(option).then(outInfo=>{
                    let tileset=outInfo.tileset;
                    let outputfile=outInfo.output;
                    fs.writeJsonSync(outputfile,tileset);
             });
      }

      ///追加编译，由于模型的数量多，可能又有变动，因此需要动态的追加编译
      //Q1 追加的模型会使得四叉树发生变化，因此部分节点仍然需要重新创建，功能较为麻烦滞后处理
      public static BuilderAdditional()
      {

      }

      


      //创建tileset文件
      private static CreateTileset(rootNode:TreeNode<any>)
      {
            let root:any={};
            root.asset={};
            root.asset.version="0.0";
            root.asset.tilesetVersion="1.0";
            //默认设置Z坐标向上
            root.asset.gltfUpAxis= 'Z';
            root.geometricError = this.evaluateSSE(rootNode);
            root.root=this.NodeToTileset(rootNode);
            //设置变换矩阵,这里的高度并没有考虑变换，因此后期可能需要调整和地形的关系
            let transform=this.wgs84Transform(this.centerCord[0],this.centerCord[1],this.centerCord[2]);
            var transformArray = (defined(transform) && !Matrix4.equals(transform, Matrix4.IDENTITY)) ? Matrix4.pack(transform, new Array(16)) : undefined;
            root.root.transform=transformArray;
            root.root.refine="add";
            return  root;
      }

      //评估SSE
      private static evaluateSSE(node: TreeNode<any>)
      {
            if(!node) return  null;
            return  Math.sqrt(node.Bounds.Width *node.Bounds.Width + node.Bounds.Long*node.Bounds.Long+node.Bounds.Height*node.Bounds.Height) / 10.0;
      }

      private static NodeToTileset(node: TreeNode<any>) {
            if (!node) return null;
            let newset: any = {};
            newset.boundingVolume = {};
            //SSE的计算暂时以节点的边框的斜线除以500个像素为准，详细再作自定义
            newset.geometricError = this.evaluateSSE(node);
            
            //经纬度宽度
            //对于城市这样大的范围并不能忽略地球曲率的影像，四叉树是按平面坐标划分，因此转换成经纬度坐标时势必存在偏移和旋转等问题
            //这里使用box作为范围而非region     
            newset.boundingVolume.box = node.Bounds.Center.concat([node.Bounds.Long / 2.0, 0, 0], [0, node.Bounds.Width / 2.0, 0], [0, 0, node.Bounds.Height / 2.0]);
            if (node.ContentEnvelope) {
                 newset.content={};
                 newset.content.url=node.Tag;
                 newset.content.boundingVolume={};
                 newset.content.boundingVolume.box=node.ContentEnvelope.Center.concat([node.ContentEnvelope.Long / 2.0, 0, 0], [0, node.ContentEnvelope.Width / 2.0, 0], [0, 0, node.ContentEnvelope.Height / 2.0]);
            }
            node.SubNodes.forEach(cNode => {
                  let childSet = this.NodeToTileset(cNode);
                  if (childSet) {
                        if (!newset.children) newset.children = [];
                        newset.children.push(childSet)
                  };
            });
            return newset;
      }

     
        //距离转换成经纬度距离
        private  static metersToLongitude(meters:number, latitude:number) {
            return meters * 0.000000156785 / Math.cos(latitude);
        }
        
        private static metersToLatitude(meters:number) {
            return meters * 0.000000157891;
        }
        
        //变换矩阵，使得gltf文件能在cesium里面正常显示
        private static wgs84Transform(longitude:number, latitude:number, height:number) {
            return Transforms.headingPitchRollToFixedFrame(Cartesian3.fromRadians(longitude, latitude, height), new HeadingPitchRoll());
        }     
}


export class tilesetBuilderTest
{
      public static Test()
      {
            let curpath="E:\\swyy\\TestFolder\\objTo3d-tiles\\test\\buildings\\output\\images\\buildings.gltf";
            let outDir="E:\\swyy\\TestFolder\\objTo3d-tiles\\test\\buildings\\output\\images"
            tilesetBuilder.Builder(curpath,outDir);
      }
}