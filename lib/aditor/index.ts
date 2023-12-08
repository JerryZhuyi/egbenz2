import { reactive } from 'vue';

import { registerComponent, renderComponentFromNode } from './renderer';
import { AditorDocState, loadJSON2ANode } from './states';

import { AditorChildNode, AditorLeafNode } from './nodes'

import aditor from './components/aditor.vue';
import aditorText from './components/aditorText.vue';
import aditorParagraph from './components/aditorParagraph.vue';

registerComponent(aditor.name, aditor)
registerComponent(aditorParagraph.name, aditorParagraph)
registerComponent(aditorText.name, aditorText)

export function renderAditorFromJSON(json:any){
    const anode = reactive(loadJSON2ANode(json))
    const vnode = renderComponentFromNode(anode)
    const doc = new AditorDocState((anode as AditorChildNode), vnode)

    return doc 
}

export {
    AditorChildNode,
    AditorLeafNode,
    AditorDocState
}

