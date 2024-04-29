export default class SyncRegiest{
    static reg_ = {}
    static get reg() {
     return this.reg_   
    }
    constructor() {
        
    }
    static classById(syncId){
        const info = this.reg[syncId];
        if(!info) throw new Error('no syncId class');
        return info;
    }
    static addClass(syncer){
        this.reg[syncer.id()] = syncer;
    }
}