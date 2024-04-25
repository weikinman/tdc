
<script lang="jsx">

import draggable from 'vuedraggable'
import { DRAGER_TYPE_KEY } from '@/libs/const/editor/index'
import RenderCompoent from './renderComponent'

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
        const itemSlots = {
            item: ({element, index}) => {
                return (
                    <div class={element[DRAGER_TYPE_KEY]==='layout' ? 'preview-layout':'preview-sprite'}>
                        <div class="preview-item"> {element.key || element.name}</div>
                        <Nested class={element[DRAGER_TYPE_KEY]==='layout' ? 'preview-child-layout':''}  group={{name:'sprite'}}  list={element.children}></Nested>
                    </div>
                )
            }
        }
        return ()=>(
            <draggable class="preview-content" group={props.group} sort={false} list={props.list} item-key="key" v-slots={itemSlots}>
                
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

