import fields,{getField,getFieldLabel} from './libs/core/fields/index';


console.log('username',getField('user','username'));
console.log('username label',getFieldLabel('user','username'));
console.log('fields',fields)

import { createApp } from 'vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './testApp.vue'

const app = createApp(App)

// 使用element-plus 并且设置全局的大小
app.use(ElementPlus)
  
  app.mount('#app')