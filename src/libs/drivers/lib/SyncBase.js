
export default class SyncBase{
    // file_api ins
    fileApi_;
    //
    db_;

    logger_;

    synchronizer_;

    options_;
    constructor(db,options){
      this.db_ = db;
      this.options_ = options;    
    }

    setApi(_api) {
        this.fileApi_ = _api;  
    }
    
    setLogger(logger){
        this.logger_ = logger;
    }

    logger(){
        return this.logger_;
    }

    db() {
        return this.db_;
    }
}