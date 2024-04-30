import SyncRegiest from "./lib/SyncRegiest";
import SyncOneDrive from "./lib/SyncOneDrive";
import { reg } from "./lib/registry";
import { stringify, parse } from 'query-string';
import Setting from "./lib/setting";

export default async function start(onedriveUrl) {
    SyncRegiest.addClass(SyncOneDrive);
    const authCode_ = 'M.C543_SN1.2.U.f7e78fad-2d03-c492-b4ed-50681832af8f';
    const syncer = reg
    .getSyncer(SyncOneDrive.id())
    const api = await syncer
        .api();
    const searchOpt = parse(location.search);
    const auth = Setting.getLocalValue(`sync.${syncer.syncTargetId()}.auth`)
    if(!searchOpt.code && !auth){
        location.href =  api.authCodeUrl('http://localhost/');
        return
    }else if( searchOpt.code){
        await api.execTokenRequest(searchOpt.code, 'http://localhost/', true);
        // Setting.setValue(`sync.${syncer.syncTargetId()}.auth`, json ? JSON.stringify(json) : null);
        // Setting.setLocalValue(`sync.${syncer.syncTargetId()}.auth`, json);
        setTimeout(()=>{
            
            location.search = '';
        },2000);
         
    }
    
    console.log('get token after',auth)
    if(auth){
        api.setAuth(auth);
        setTimeout(async ()=>{
            const fileApi = await syncer.initFileApi();
            console.log('fileApi',fileApi)
            // fileApi.mkdir('testApiSend')
            // fileApi.put('test1.txt', 'testing');
            // fileApi.list()
            // fileApi.stat('temp')
            fileApi.mkdir('temp/testAdd2')
        },1000)
    }
    

    //    .execTokenRequest(authCode_, 'http://localhost/', true);
    console.log(SyncRegiest.reg)
}