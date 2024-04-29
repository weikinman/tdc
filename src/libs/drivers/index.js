import SyncRegiest from "./lib/SyncRegiest";
import SyncOneDrive from "./lib/SyncOneDrive";
import { reg } from "./lib/registry";
import { stringify, parse } from 'query-string';

export default function start(onedriveUrl) {
    SyncRegiest.addClass(SyncOneDrive);
    const authCode_ = 'M.C543_SN1.2.U.f7e78fad-2d03-c492-b4ed-50681832af8f';
    const syncer = reg
    .getSyncer(SyncOneDrive.id())
    const api = syncer
        .api();
    const searchOpt = parse(location.search);
    if(!searchOpt.code){
        location.href =  api.authCodeUrl('http://localhost/');
        return
    }
    api.execTokenRequest(searchOpt.code, 'http://localhost/', true);
    syncer.initFileApi();

    //    .execTokenRequest(authCode_, 'http://localhost/', true);
    console.log(SyncRegiest.reg)
}