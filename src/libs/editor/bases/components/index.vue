<template>
    <div>
        <draggable :group="groupOpts" :list="components" :clone="clone" :sort="false" @end="end" item-key="name">
            <template #item="{ element }">
                <div  class="base-item">
                    <div :is="element.name" >{{ element.name }}</div>
                    <!-- <Nested :group="{name:'fields'}" :list="element.children"></Nested> -->
                </div>
            </template>
        </draggable>
    </div>
</template>
<script>
export default {
    name: 'Layouts'
}
</script>
<script setup>
import draggable from 'vuedraggable'
import * as elementPlus from 'element-plus'
import { DRAGER_TYPE_KEY } from '@/libs/const/editor/index'
import RenderCompoent from './renderComponent'
const components = reactive([]);
let groupOpts = { name: 'sprite', pull: 'clone', put: false };

Object.keys(elementPlus).forEach(key => {
    const element = elementPlus[key];
    // console.log(element)
    //&& element.name.indexOf('Item')===-1 && element.name.indexOf('Column')===-1 && element.name.indexOf('Dropdown')===-1 && element.name.indexOf('Option')===-1&& element.name.indexOf('Select')===-1&& element.name.indexOf('ElStep')===-1
    if (typeof  element.name ==='string' &&  element.name.indexOf('El')===0  ) { 
        const asyncComp = defineAsyncComponent( element);
        
        // console.log(asyncComp,element)
        const findChild = Object.keys(element).find(item=>{
            let eleName = element.name.replace(/El/g,'');
            console.log('findChild',element.name,item,eleName)
            return item?.indexOf(eleName)!==-1
        });
        if(findChild)return true;
        
        const props = element.props;
        const toProps = {};
        props && Object.keys(props).forEach(key=>{
            let _prop = props[key];
            if(_prop.default){
                toProps[key] =   _prop.default 
            }else{
                if(_prop?.required===true){
                    toProps[key] = 'defaultValue';
                }
            }
        });
        const Comp = RenderCompoent(asyncComp,toProps);
        console.log('Comp',Comp,element)
        components.push({
            [DRAGER_TYPE_KEY]: 'components',
            name: element.name,
            component: Comp,
            toProps,
            children:[]
        })
    }
});
console.log('components', components, elementPlus)
function end(a, b, c) {
    console.log('end', a, groupOpts)
}
function clone(opts, b, c) {
    console.log('clone', opts, groupOpts, c)

    return { ...opts, children: [...opts.children] };
}
</script>
<style scoped>
.base-item {
    display: inline-block;
    padding: 5px 10px;
    border: 1px solid #ddd;
}
</style>