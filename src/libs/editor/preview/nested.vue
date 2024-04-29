
<script lang="jsx">

import draggable from 'vuedraggable'
import RenderCompoent from './renderComponent'
import { DRAGER_TYPE_KEY, DRAGER_COUNT_KEY } from '@/libs/const/editor/index'
const Nested = defineComponent({
    name:'Nested',   
    props:{
        paramWidth:'',
        list:{
            default(){
                return [];
            }   
        },
        group:'' 
    },
    setup(props,{slots}){
        const fieldDataArr = reactive([]);
        const activeNames = ref('');
        console.log('setup inso',props,slots);
        const getChild = (element)=>{
           
            let type = element[DRAGER_TYPE_KEY];
            let isLayout = type=='layout';
            let isComponents = type=='components';
            let toProps = element.toProps;
            let res = ('');
            const CompoentName = element.component;
            console.log('getChild prev',element,toProps);
            if(isComponents){
               
                res = (
                    <CompoentName {...toProps}>
                        {element.name}
                    </CompoentName>
                )
            }else if(!isLayout){
                res = <div class="preview-item"> {element.key || element.name}</div>
            }else {
                res = <Nested class={type==='layout' ? 'preview-child-layout':''}  group={{name:'sprite'}}  list={element.children}></Nested>
            }
            console.log('getChild',res);
            return res
        }
        const itemSlots = {
            item: ({element, index}) => {
                let type = element[DRAGER_TYPE_KEY];
                
                console.log('itemSlots',element,);
                return (
                    <div class={type==='layout' ? 'preview-layout':'preview-sprite'}>
                        {
                           
                            getChild(element)
                        }
                    </div>
                )
            }
        }
        return ()=>(
            <draggable class="preview-content" group={props.group} sort={false} list={props.list} item-key={DRAGER_COUNT_KEY} v-slots={itemSlots}>
                
            </draggable>
        ) 
    }
})
export default Nested;
</script>
<style scoped>
.preview-box{
    height: 500px;
    /* width:400px; */
    border: 1px solid #ddd;
    float: left;
}
.preview-content{
    
}
.preview-layout{
    width:100%;
    border: 1px dashed #ddd;
}

.preview-sprite{
    display: inline-block;
}
.preview-item{
    border: 1px solid #ccc;
    padding: 10px 20px;
    margin-bottom: 5px;
    display: inline-block;
    cursor: pointer;
}
.preview-child{
    width:100%;
    min-height: 100px;
    border:1px solid #e99
}
.preview-child-layout{
    min-height: 30px;
}
</style>

