import Cesium = require('cesium');
import ArrayStorage = require('../../lib/ArrayStorage');
import createGltf = require('../../lib/createGltf');
import loadObj = require('../../lib/loadObj');
import writeGltf = require('../../lib/writeGltf');
import obj2gltf=require("../../lib/obj2gltf");
import {Promise} from "bluebird"
import fsExtra = require('fs-extra');
var ComponentDatatype = Cesium.ComponentDatatype;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

export class objDataStruct
{
    public constructor()
    {
          this.nodes.push(new Node());
    }
    nodes : Node[]=new Array();
    materials : any=[];
    name : any;



    //转换成GLTF文件
    public toGltf(path:string)
    {
        let options:any={};
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
        //options.logger = defaultValue(options.logger, getDefaultLogger());
        //options.writer = defaultValue(options.writer, getDefaultWriter(options.outputDirectory));       
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

        
       var gltf= createGltf(this,options)
       writeGltf(gltf.gltf,options).then(function(result:any){
            fsExtra.writeJsonSync(path,result)
        })        
    }

    //添加实体的方法
    public AddPrimitive(obj:objDataStruct,pri:Primitive)
    {
        var positions=obj.nodes[0].meshes[0].positions;
        var uvs=obj.nodes[0].meshes[0].uvs;
        var normals=obj.nodes[0].meshes[0].normals;
        //从原始数据中读出相关内容
        //1.读取顶点，贴图，法线向量，由于是同步添加因此三者具有相同的索引
        var newPrim=new Primitive();
        //起始点索引
        var startIndex=this.nodes[0].meshes[0].positions.length/3;
        for (var index = 0; index < pri.indices.length; index++) {
            var element = pri.indices.get(index);
            //push之后返回其索引          
            this.nodes[0].meshes[0].positions.push(positions[index*3],positions[index*3+1],positions[index*3+2]);
            this.nodes[0].meshes[0].uvs.push(uvs[index*3],uvs[index*3+1],uvs[index*3+2]);
            this.nodes[0].meshes[0].normals.push(normals[index*3],normals[index*3+1],normals[index*3+2]);
            console.log(this.nodes[0].meshes[0].positions.length);
            newPrim.indices.push(index+startIndex);           
        }
        //原始文件的材质
        var material=obj.materials;
        //查找相关材质
        var curMat= material.find((mat:any)=>{return mat.name===pri.material;});
        //添加primitive
        this.nodes[0].meshes[0].primitives.push(newPrim);
        //添加材质
        this.materials.push(curMat);
    }

}

export class Node
{
    public constructor()
    {
        this.meshes.push(new Mesh());
    }
    name:any;
    meshes:Mesh[]=new Array();
}

export class Mesh
{
    name:any;
    primitives:Primitive[]=new Array();
    positions:any = new ArrayStorage(ComponentDatatype.FLOAT);
    normals:any = new ArrayStorage(ComponentDatatype.FLOAT);
    uvs:any = new ArrayStorage(ComponentDatatype.FLOAT);

    
}


export class Primitive {
    material:any = undefined;
    indices = new ArrayStorage(ComponentDatatype.UNSIGNED_INT);
}