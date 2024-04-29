//文件系統操作基礎類
export default class FileApi{

    platformPath;

    constructor() {
        
    }
    setPath(_path) {
     this.platformPath = _path;   
    }
    
    move(source,dest){}

    copy(source,dest){}

    mkFile(fileName,dir) {
        
    }
    mkdir(dir) {
        
    }
}