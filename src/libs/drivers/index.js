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
    console.log(api.token())
    if(!searchOpt.code && !api.token()){
        location.href =  api.authCodeUrl('http://localhost/');
        return
    }else if( searchOpt.code){
        await api.execTokenRequest(searchOpt.code, 'http://localhost/', true);
         location.search = '';
    }
    if(api.token()){
        setTimeout(()=>{
            syncer.initFileApi();
        },1000)
    }
    

    //    .execTokenRequest(authCode_, 'http://localhost/', true);
    console.log(SyncRegiest.reg)
}