import { registerComponent, renderComponentFromNode } from './renderer';
import { AditorDocState, type docStruct } from './states';
import { AditorDocView } from './views';

import aditor from './components/aditor.vue';
import aditorText from './components/aditorText.vue';
import aditorParagraph from './components/aditorParagraph.vue';

registerComponent(aditor.name, aditor)
registerComponent(aditorParagraph.name, aditorParagraph)
registerComponent(aditorText.name, aditorText)

export function renderAditorFromJSON(json:any){
    const docView = new AditorDocView()
    const docState = new AditorDocState()
    docState.loadJSON2ANode(json)
    const vNode = renderComponentFromNode(docState.root, docView)
    docView.init(docState, vNode)

    return docView 
}

export {
    AditorDocState
    , AditorDocView
    , registerComponent
    , docStruct
}

