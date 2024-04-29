//高階組件
export default {
    props: {
    // 接受一个动态的组件类型
        componentType: null,
        toProps:{
            default(){
                return {}
            }
        }
    },
    render(h) {
        const components = {
            componentType:this.componentType
        };
        
        // 动态决定渲染哪个组件
        const SelectedComponent = components['componentType'] || null;
        
        return (
            <SelectedComponent {...this.props} />
        );
    }
    
}