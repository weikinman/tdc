export default class SyncRegiest{
    static reg_ = {}
    static get reg() {
     return this.reg_   
    }
    constructor() {
        
    }
    static classById(syncTargetId){
        const info = this.reg[syncTargetId];
        if(!info) throw new Error('no syncTargetId class');
        return info;
    }
    static addClass(syncer){
        this.reg[syncer.id()] = syncer;
    }
}