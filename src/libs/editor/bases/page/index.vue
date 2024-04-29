<template>
    <div>
        <draggable  :group="groupOpts" :list="layouts" :clone="clone" :sort="false" @end="end" item-key="key">
            <template #item="{element}">
                <div>
                    <div class="base-item"> {{element.key}}</div>
                     <Nested :group="{name:'sprite'}" :list="element.children"></Nested>
                </div>
            </template>
        </draggable>
    </div>
</template>
<script>
    export default {
     name:'Layouts'   
    }
</script>
<script setup>
import draggable from 'vuedraggable'
import Nested from '@/libs/editor/preview/nested.vue'
import { DRAGER_TYPE_KEY } from '@/libs/const/editor/index'
const layouts = reactive([{
    key:'page',
    [DRAGER_TYPE_KEY]:'page',
    children:[]    
}]);
let groupOpts = {name:'page', pull: 'clone', put: false}
function end(a,b,c){
 console.log('end',a,groupOpts)   
}
function clone(opts,b,c){
    console.log('clone',opts,groupOpts,c)
    
    return {...opts,children:[...opts.children]};
}
</script>
<style scoped>
.base-item{
    display: inline-block;
    padding:5px 10px;
    border:1px solid #ddd;
}
</style>