const http = require('http');
const Path=require("path");
const fs=require("fs");

var server = http.createServer(function (req, res){
    let fileName=Path.resolve(__dirname,"."+req.url);

    if (req.url === '/'){
        fileName = Path.resolve(__dirname, 'index.html');
    }

    console.log(fileName);

    const extName=Path.extname(fileName).substr(1);


    if (fs.existsSync(fileName)) { 

        var mineTypeMap={
            html:'text/html;charset=utf-8',
            htm:'text/html;charset=utf-8',
            xml:"text/xml;charset=utf-8",
            png:"image/png",
            jpg:"image/jpeg",
            jpeg:"image/jpeg",
            gif:"image/gif",
            css:"text/css;charset=utf-8",
            txt:"text/plain;charset=utf-8",
            mp3:"audio/mpeg",
            mp4:"video/mp4",
            ico:"image/x-icon",
            tif:"image/tiff",
            svg:"image/svg+xml",
            zip:"application/zip",
            ttf:"font/ttf",
            woff:"font/woff",
            woff2:"font/woff2",
            js: "text/javascript;charset=utf-8"
        }

        if (mineTypeMap[extName]) {
            res.setHeader('Content-Type', mineTypeMap[extName]);
        }
        var stream=fs.createReadStream(fileName);
        stream.pipe(res);
    }   
}).listen(8888);

console.log('服务器监听端口:'+ server.address().port);