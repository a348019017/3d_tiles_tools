"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cesium = require("cesium");
const ArrayStorage = require("../../lib/ArrayStorage");
const createGltf = require("../../lib/createGltf");
const writeGltf = require("../../lib/writeGltf");
const obj2gltf = require("../../lib/obj2gltf");
const fsExtra = require("fs-extra");
var ComponentDatatype = Cesium.ComponentDatatype;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
class objDataStruct {
    constructor() {
        this.nodes = new Array();
        this.materials = [];
        this.nodes.push(new Node());
    }
    //转换成GLTF文件
    toGltf(path) {
        let options = {};
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
        var gltf = createGltf(this, options);
        writeGltf(gltf.gltf, options).then(function (result) {
            fsExtra.writeJsonSync(path, result);
        });
    }
    //添加实体的方法
    AddPrimitive(obj, pri) {
        var positions = obj.nodes[0].meshes[0].positions;
        var uvs = obj.nodes[0].meshes[0].uvs;
        var normals = obj.nodes[0].meshes[0].normals;
        //从原始数据中读出相关内容
        //1.读取顶点，贴图，法线向量，由于是同步添加因此三者具有相同的索引
        var newPrim = new Primitive();
        //起始点索引
        var startIndex = this.nodes[0].meshes[0].positions.length / 3;
        for (var index = 0; index < pri.indices.length; index++) {
            var element = pri.indices.get(index);
            //push之后返回其索引          
            this.nodes[0].meshes[0].positions.push(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);
            this.nodes[0].meshes[0].uvs.push(uvs[index * 3], uvs[index * 3 + 1], uvs[index * 3 + 2]);
            this.nodes[0].meshes[0].normals.push(normals[index * 3], normals[index * 3 + 1], normals[index * 3 + 2]);
            console.log(this.nodes[0].meshes[0].positions.length);
            newPrim.indices.push(index + startIndex);
        }
        //原始文件的材质
        var material = obj.materials;
        //查找相关材质
        var curMat = material.find((mat) => { return mat.name === pri.material; });
        //添加primitive
        this.nodes[0].meshes[0].primitives.push(newPrim);
        //添加材质
        this.materials.push(curMat);
    }
}
exports.objDataStruct = objDataStruct;
class Node {
    constructor() {
        this.meshes = new Array();
        this.meshes.push(new Mesh());
    }
}
exports.Node = Node;
class Mesh {
    constructor() {
        this.primitives = new Array();
        this.positions = new ArrayStorage(ComponentDatatype.FLOAT);
        this.normals = new ArrayStorage(ComponentDatatype.FLOAT);
        this.uvs = new ArrayStorage(ComponentDatatype.FLOAT);
    }
}
exports.Mesh = Mesh;
class Primitive {
    constructor() {
        this.material = undefined;
        this.indices = new ArrayStorage(ComponentDatatype.UNSIGNED_INT);
    }
}
exports.Primitive = Primitive;
//# sourceMappingURL=objData.js.map