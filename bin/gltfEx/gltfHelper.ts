import { Envelope3D} from "../quadtree/envelop3D"
import fs=require( "fs-extra");
import path=require("path");
import  mime=require("mime");
import fetch from 'node-fetch';

export class GltfHelper {


    public static Test() {
        //let path = "E:\\swyy\\TestFolder\\objTo3d-tiles\\bin\\barrel\\output\\barrel.gltf";
        //let gltf = fs.readJsonSync(path);
       // this.GetBoundBoxOfSingleNode(gltf);
         let curpath="E:\\swyy\\TestFolder\\objTo3d-tiles\\test\\12321.gltf";
         let dir=path.dirname(curpath);
         
         let gltf = fs.readJsonSync(curpath);
         this.WriteUrlInFIle(gltf,dir).then(data=> {
             fs.writeJSON(dir+"\\"+"1234.gltf",gltf)
             ;});   
    }


    


 

    //计算gltf中每个node的最小外包矩形，此
    public static GetBoundBoxOfSingleNode(gltf: any): Envelope3D[]|null {
        try {
            let envs: Envelope3D[] = new Array();
            gltf.nodes.forEach(ele => {
                let node: any = ele;
                let meshIds = node.mesh;
                //查找此mesh
                let curMesh = gltf.meshes[meshIds];
                //查找此mesh的assor
                //获取几何体
                let primitives = curMesh.primitives;
                let maxEnv:any;
                primitives.forEach(pri=>{
                    let accessorPositionId =pri.attributes.POSITION;
                    //查找此accessor的bufferview
                    let posssition = gltf.accessors[accessorPositionId];
                    //查找此BufferView的buffer
                    //直接从数据中获取其min和max，没有的话从实际数据中计算
                    let min = posssition.min;
                    let max = posssition.max;
                    let env=new Envelope3D(min[0], max[0], min[1], max[1], min[2], max[2]);
                    if(!maxEnv) maxEnv=env;
                    maxEnv.ExpandToInclude(env);
                })                
                envs.push(maxEnv);
                
            });
            //查找实际的position数据
            console.log(envs);
            return envs;
        } catch (ex) {
            console.log(ex);
            return null;
        }
    }

   //buffer.uri = 'data:application/octet-stream;base64,' + source.toString('base64');
    //如果纹理和buffer是通过Url引用，将其写成二进制到文件中
    public static WriteUrlInFIle(gltf:any,dir:any):Promise<any>
    {
        //检查buffer中的uri是否为相对路径
      let actions:Array<any>=  gltf.buffers.map(buf=>{
            let uri:string=buf.uri;
            if(uri.startsWith("data:application/octet-stream;base64,")) return;
            //读取文件路径下的
            let binPath=dir+"\\"+uri;
            return fs.pathExists(binPath).then(exit=>{
                if(exit) { 
                    let buffer= fs.readFileSync(binPath);
                    buf.uri="data:application/octet-stream;base64,"+buffer.toString("base64");             
                };
            }).catch(err=>{ 
                console.log(binPath+"write err"); })          
        });
        //检查image中的Uri,不必将其写在buffer中，直接通过datauri的形式写入uri中
        //image/jpeg
        //image/png
        let images:Array<any>=gltf.images;
        let actionsimags= images.map(img=>{
            let uri:string=img.uri;
            if(uri.startsWith("data:image/")) return;
            //读取文件路径下的
            let binPath=dir+"\\"+uri;
            return fs.pathExists(binPath).then(exit=>{
                if(exit){ 
                    let data= fs.readFileSync(binPath);
                    if(binPath.endsWith("jpg")) 
                    {
                        img.uri="data:image/jpeg;base64,"+data.toString("base64");                      
                    }  
                    else if(binPath.endsWith("png")) img.uri="data:image/png;base64,"+data.toString("base64");
                    else console.log("err image format")} 
                    img.mimeType=mime.getType(binPath);                 
                })
            .catch(err=>{
                 console.log(binPath+"write err"); })  ;     
         });
         //合并两组任务
         return Promise.all(actions.concat(actionsimags));
    }

}