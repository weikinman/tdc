<template>
  <!-- <div>
    <Form :entityName="'user'"></Form>
    <Table :entityName="'user'" :data="tableDatas" ></Table>
  </div>

  <div>
    <Form :entityName="'role'"></Form>
    <Table :entityName="'role'" :data="tableDatas" ></Table>
  </div>

  <div>
    <Form :entityName="'mail'"></Form>
    <Table :entityName="'mail'" :data="tableDatas" ></Table>
  </div> -->
  <!-- <iframe ref="iframeRef" :src="onedriveUrl" style="height:300px; width:400px;"></iframe> -->
  <!-- <Editer></Editer> -->
</template>

<script setup>
// import Form from './libs/core/forms/form.vue'
// import Table from './libs/core/tables/table.vue'
// import Editer from './libs/editor/index.vue'
// import {reg} from './libs/editor/registry'

// const tableDatas = reactive([
//   {username:'1111'}
//   ]);
  // import { FileApiDriverOneDrive }  from './libs/lib/file-api-driver-onedrive.js';
  // import SyncTargetRegistry from './libs/lib/SyncTargetRegistry';
  // import SyncTargetOneDrive from './libs/lib/SyncTargetOneDrive';
  // import Database from './libs/lib/database.js';
  // import {reg} from './libs/lib/registry.js'

  // import {OneDriveLoginScreenComponent} from './onedrive-login'

  // console.log('reg',reg);
  // let database = new Database();
  // reg.setDb(database)
  // SyncTargetRegistry.addClass(SyncTargetOneDrive);
  // async function lo(){
  //   // const authCode_ = 'jjjfjew32jds9f32fj32f';
  //   // const res = await reg
	// 	// 			.syncTarget()
	// 	// 			.api()
	// 	// 			.execTokenRequest(authCode_, 'http://localhost/', true);
	// 	// 		// this.props.dispatch({ type: 'NAV_BACK' });
  //   //   console.log('lo', res);
	// 	// 		reg.scheduleSync(0); 

  //   const onedriveLogin = new OneDriveLoginScreenComponent();

  //   onedriveLogin.retryButton_click();
  // } 

  // lo();


  // import OneDriveApi from './libs/lib/onedrive-api';
  // const api = new OneDriveApi('testID', 'secret', true);

  // const fileAPi = new FileApiDriverOneDrive()
  // fileAPi.api()
  // console.log(api.authorizationTokenRemoved({ Authorization: 'testing' }));


//-----------------------------------------------------------

import drive from './libs/drivers/index.js'
const onedriveUrl = ref('');
drive(onedriveUrl);
</script>
