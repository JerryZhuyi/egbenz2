import { reactive } from 'vue';

import { registerComponent, renderComponentFromNode } from './renderer';
import { AditorDocState, loadJSON2ANode, type docStruct } from './states';
import { AditorDocView } from './views';

import aditor from './components/aditor.vue';
import aditorText from './components/aditorText.vue';
import aditorParagraph from './components/aditorParagraph.vue';

registerComponent(aditor.name, aditor)
registerComponent(aditorParagraph.name, aditorParagraph)
registerComponent(aditorText.name, aditorText)

export function renderAditorFromJSON(json:any){
    const docState = new AditorDocState()
    const docView = new AditorDocView(docState)
    const anode = reactive(loadJSON2ANode(json, docState))
    const vnode = renderComponentFromNode(anode, docState)
    docState.init(anode, vnode, docView)

    return docState 
}

export {
    AditorDocState
    , registerComponent
    , docStruct
}

