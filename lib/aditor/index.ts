import aditor from './components/aditor';
import aditorText from './components/aditorText';
import {registerComponent, renderComponentFromJSON} from './renderer';

class AditorCore{

    constructor(){
        this.init()
    }
    init(){ 
        registerComponent(aditor.name, aditor)
        registerComponent(aditorText.name, aditorText)
    }
    
    renderComponentFromJSON(json:any){
        return renderComponentFromJSON(json)
    }
}

const aditorCore = new AditorCore();
export default aditorCore;