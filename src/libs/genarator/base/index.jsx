function uiConfig(componentName,props){
    return {
        componentName,
        props,
        genPreview:null,
        genRender:null
    }
}

class BaseGenarator{
    confgs = [];
    ui = null
    constructor() {
        
    }

    setUI(uiFw) {
        this.ui = uiFw
    }

    getRenderer(h) {
        return ()=>(
            <view></view>
        )
    }
    /**
     * 
     * @param {componentName,props} param0 
     */
    addConfig({componentName,props}) {
        this.confgs.push(uiConfig(componentName,props))
    }

    /**
     * 
     * @param {*} componentName 
     * @returns {componentName,config}
     */
    getConfig(componentName){
        return this.confgs.find(config=>config.componentName===componentName);
    }



}