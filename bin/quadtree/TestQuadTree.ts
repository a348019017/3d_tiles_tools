//测试四叉树算法
//不加路径即是从npm中查找
import shapefile = require("shapefile");
import {Quadtree} from "./quadtree";
import {TreeNode} from "./treeNode"
import {Envelope3D} from "./envelop3D";
import {Feature} from "geojson"
import loadObj=require('../../lib/loadObj');
import Cesium=require('cesium');
import  {objDataStruct,Mesh,Node,Primitive} from "../builder/objData";
import obj2gltf=require("../../lib/obj2gltf");
import {GltfHelper} from "../gltfEx/gltfHelper";

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;


//常见编码名称utf-8, iso-8859-2, koi8, cp1261, gbk
//一般使用gbk或者utf8去解决shp文件的中文乱码问题，问题再看。
function Test()
{
    let shpPath= "C:\\Users\\1\\Desktop\\shp\\test_cy_zd.shp";
    let dbfPath= "C:\\Users\\1\\Desktop\\shp\\test_cy_zd.dbf";
    let option:shapefile.Options={encoding:"gbk",highWaterMark:65536};
    shapefile.read(shpPath,dbfPath,option)
    .then(source =>
      {
        let tree:Quadtree<number|string|undefined>;
        //没有bbox将无法创建
        if (source.bbox!=undefined) {
          tree=new Quadtree<number|string|undefined>(new Envelope3D(source.bbox[0],source.bbox[2],source.bbox[1],source.bbox[3],0,0),{maxLevel:4,maxShapesCount:20});
        } else
        {
          return;
        }     

        for (var index = 0; index < source.features.length; index++) {
          var element = source.features[index];
          if (element!=undefined) {
            //根据geometry计算其bbox
            let env= GeometryToBBox(element);
            if(env!=null&&env!=undefined) tree.insert(index,env);           
          }             
        }
              
      }
      )             
    .catch(error => console.error(error.stack));
    


}

//加载整个obj文件并分块,按分块内容生成b3dm
function Test2() {
  var objPath="C:\\Users\\1\\Desktop\\exporttest\\test_cy_zd.obj";
  var exportPath="C:\\Users\\1\\Desktop\\exporttest\\test_cy_zd2.gltf";
  //let objPath = "E:\\swyy\\TestFolder\\objTo3d-tiles\\bin\\barrel\\barrel.obj";
  let options: any = {};
  

  var defaults = obj2gltf.defaults;
  options = defaultValue(options, {});
  options.binary = defaultValue(options.binary, defaults.binary);
  options.separate = defaultValue(options.separate, defaults.separate);
  options.separateTextures = defaultValue(options.separateTextures, defaults.separateTextures) || options.separate;
  options.checkTransparency = defaultValue(options.checkTransparency, defaults.checkTransparency);
  options.secure = defaultValue(options.secure, defaults.secure);
  options.packOcclusion = defaultValue(options.packOcclusion, defaults.packOcclusion);
  options.metallicRoughness = defaultValue(options.metallicRoughness, defaults.metallicRoughness);
  options.specularGlossiness = defaultValue(options.specularGlossiness, defaults.specularGlossiness);
  options.materialsCommon = defaultValue(options.materialsCommon, defaults.materialsCommon);
  options.overridingTextures = defaultValue(options.overridingTextures, defaultValue.EMPTY_OBJECT);
  options.logger = function(err:any){console.log(err)};
  
  //options.writer = defaultValue(options.writer, getDefaultWriter(options.outputDirectory));

  if (!defined(objPath)) {
      throw new DeveloperError('objPath is required');
  }

  if (options.separateTextures && !defined(options.writer)) {
      throw new DeveloperError('Either options.writer or options.outputDirectory must be defined when writing separate resources.');
  }

  if (options.metallicRoughness + options.specularGlossiness + options.materialsCommon > 1) {
      throw new DeveloperError('Only one material type may be set from [metallicRoughness, specularGlossiness, materialsCommon].');
  }

  if (defined(options.overridingTextures.metallicRoughnessOcclusionTexture) && defined(options.overridingTextures.specularGlossinessTexture)) {
      throw new DeveloperError('metallicRoughnessOcclusionTexture and specularGlossinessTexture cannot both be defined.');
  }

  if (defined(options.overridingTextures.metallicRoughnessOcclusionTexture)) {
      options.metallicRoughness = true;
      options.specularGlossiness = false;
      options.materialsCommon = false;
      options.packOcclusion = true;
  }

  if (defined(options.overridingTextures.specularGlossinessTexture)) {
      options.metallicRoughness = false;
      options.specularGlossiness = true;
      options.materialsCommon = false;
  }

  let tree: Quadtree<number | string | undefined>;
  let maxEnv:any = null;
  let envs: any[] = [];
  loadObj(objPath, options).then(
    function (objData: any) {
      var newObj:objDataStruct=new objDataStruct();
      var primitives=objData.nodes[0].meshes[0].primitives;
      var positions=objData.nodes[0].meshes[0].positions.typedArray;     
     /// console.log(objData.nodes[0].meshes[0].primitives[0].indices);
      //按primitive去添加每个实体对象，仅支持shp转出的obj格式。
      for (var index = 0; index < primitives.length; index++) {
        var primitive =primitives[index];
        //根据索引获取所有点位
        let indices=primitive.indices.typedArray;
        let coords:any=[];      
        for (var i = 0; i < primitive.indices.length; i+=1) {
          var x=positions[indices[i]*3];
          var y=positions[indices[i]*3+1];
          var z=positions[indices[i]*3+2];
          coords.push([x,y,z]);                 
        }
        var env = NodeToEnvelop3D2(coords);              
        envs.push({ item: index, env: env });       
        if (!maxEnv) {
          maxEnv = env;
        } else {
          env ? maxEnv.ExpandToInclude(env) : null;
        }                    
      }
      tree = new Quadtree<number | string | undefined>(maxEnv, { maxLevel: 4, maxShapesCount: 5 });
      envs.forEach(item => {
        tree.insertEx(item.item, item.env, function (node: TreeNode<number | string | undefined>) {
            if(!node.Tag) node.Tag=new objDataStruct();
            var newObj:objDataStruct=node.Tag;
            newObj.AddPrimitive(objData,primitive);           
        })
      });
      //建树完成后写出文件
       var tag:objDataStruct= tree.Root.Tag;
       tag.toGltf(exportPath);
       console.log(tree.Root.Tag.nodes[0].meshes[0]);
     //在建立四叉树的同时建立每个节点的objData信息。因此在addContent中添加事件回调。     
    }
  );
}



function GeometryToBBox(fea:any):Envelope3D|null|undefined
{
    if(!fea.geometry||fea.geometry.coordinates.length==0) return null;  
    let minx=Number.POSITIVE_INFINITY,maxx=Number.NEGATIVE_INFINITY,miny=Number.POSITIVE_INFINITY,maxy=Number.NEGATIVE_INFINITY;
    for (var index = 0; index < fea.geometry.coordinates[0].length; index++) {
      var coord=fea.geometry.coordinates[0][index];
      if(coord[0]<minx) minx=coord[0];
      if(coord[0]>maxx) maxx=coord[0];
      if(coord[1]<miny) miny=coord[1];
      if(coord[1]>maxy) maxy=coord[1];
    }
    return new Envelope3D(minx,maxx,miny,maxy,0,0);
}

///计算每个obj的最小外包盒子
function NodeToEnvelop3D(node:any):Envelope3D|null|undefined
{
    var pos= node.meshes[0].positions;
    let minx=Number.POSITIVE_INFINITY,maxx=Number.NEGATIVE_INFINITY,miny=Number.POSITIVE_INFINITY,maxy=Number.NEGATIVE_INFINITY;
    let minz=Number.POSITIVE_INFINITY,maxz=Number.NEGATIVE_INFINITY;
    for (var index = 0; index < pos.length; index+=3) {
      var coordX =pos.typedArray[index];
      var coordY=pos.typedArray[index+1];
      var coordZ=pos.typedArray[index+2];     
      if(coordX<minx) minx=coordX;
      if(coordX>maxx) maxx=coordX;
      if(coordY<miny) miny=coordY;
      if(coordY>maxy) maxy=coordY;
      if(coordZ>maxz) maxz=coordZ;
      if(coordZ<minz) minz=coordZ;
    }
    return new Envelope3D(minx,maxx,miny,maxy,minz,maxz);
}

///计算每个obj的最小外包盒子
function NodeToEnvelop3D2(coords:any):Envelope3D|null|undefined
{   
    let minx=Number.POSITIVE_INFINITY,maxx=Number.NEGATIVE_INFINITY,miny=Number.POSITIVE_INFINITY,maxy=Number.NEGATIVE_INFINITY;
    let minz=Number.POSITIVE_INFINITY,maxz=Number.NEGATIVE_INFINITY;
    for (var index = 0; index < coords.length; index+=1) {
      var coordX =coords[index][0];
      var coordY=coords[index][1];
      var coordZ=coords[index][2];     
      if(coordX<minx) minx=coordX;
      if(coordX>maxx) maxx=coordX;
      if(coordY<miny) miny=coordY;
      if(coordY>maxy) maxy=coordY;
      if(coordZ>maxz) maxz=coordZ;
      if(coordZ<minz) minz=coordZ;
    }
    return new Envelope3D(minx,maxx,miny,maxy,minz,maxz);
}



GltfHelper.Test();