import SyncRegiest from "./SyncRegiest";
export default class Registry{

    syncs_ = {};

    logger_;

    db_;


    setLogger(logger){
        this.logger_ = logger;
    }

    logger() {
     return this.logger_;   
    }

    //獲取同步器
    getSyncer(syncTargetId){
        if(this.syncs_[syncTargetId]){
            return this.syncs_[syncTargetId]
        }

        const Syncer = SyncRegiest.classById(syncTargetId);
        let sync = new Syncer(this.db());
        sync.setLogger(this.logger());
        this.syncs_[syncTargetId] = sync;
        return sync;
    }

    setDB(db){
        this.db_ = db;
    }
    db() {
     return this.db_;   
    }
}

const reg = new Registry();

export { reg }