//计算模型变换的矩阵，即将模型由本地参考系转换到球参考系，直接使用cesium中的变换函数
var Cesium = require('cesium');
var path = require('path');
var yargs = require('yargs');

var args = process.argv;
var Transforms = Cesium.Transforms;
var cesium3=Cesium.Cartesian3;

var argv = yargs
.usage('Usage: node $0 -centerlon lon -centerlat lat ')
.example('node $0 -centerlon 114.1111 -centerlat 40.11111')
.help('h')
.alias('h', 'help')
.options({
    centerlon : {
        alias : 'lon',
        describe : '原点的经度(度)',
        type : 'number',        
        demandOption : true
    },
    centerlat : {
        alias : 'lat',
        describe : '原点的维度(度)',
        type : 'number'
    }
}).parse(args);


var lon=argv.centerlon;
var lat=argv.centerlat;

//var lon=123.111;
//var lat=40.111;

//计算的函数
function EastNorthUpTransform(lon,lat)
{
    var center= cesium3.fromDegrees(lon,lat);
    var result= Transforms.headingPitchRollToFixedFrame(center,new Cesium.HeadingPitchRoll(0,0,-1.57));  
    console.log(
        result
    );
}


EastNorthUpTransform(lon,lat);




