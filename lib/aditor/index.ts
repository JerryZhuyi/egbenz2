import { Component } from 'vue'
import { renderComponentFromNode } from './renderer';
import { AditorDocState, type docStruct } from './states';
import { AditorDocView } from './views';
import { AditorNodeFactory, ANodeType, AditorChildNode, AditorLeafNode, ANode, NodeSelectionType } from './nodes';

import aditor from './components/aditor.vue';
import aditorText from './components/aditorText.vue';
import aditorParagraph from './components/aditorParagraph.vue';


// Init Nodes Structure
export const aNodeFactory = new AditorNodeFactory();

// Init Components Resource
type AditorConfigType = {
    type: ANodeType,
    styleRules: string[]
}

export type AditorComponent = Component & { aditorConfig: AditorConfigType }

const components: { [key: string]: AditorComponent } = {}

export function registerComponent(name: string, component: any) {
    setComponentsDefaultConfig(name, component)
    components[name] = component
}

function setComponentsDefaultConfig(name:string, component: any) {
    
    const defaultChildrenStyle = ['color', 'font-size', 'font-weight', 'font-family', 'text-decoration', 'background-color', 'text-align']
    const defaultLeafStyle = ['color', 'font-size', 'font-weight', 'font-family', 'text-decoration', 'background-color']

    // set default type config
    if (!("aditorConfig" in component)) {
        component.aditorConfig = {
            class: AditorChildNode,
        }
    }else if(!("class" in component.aditorConfig)){
        component.aditorConfig.class = AditorChildNode
    }

    // register nodeClass
    aNodeFactory.registerNode(name, component.aditorConfig.class)


    // set default styleRules config
    if (!("styleRules" in component.aditorConfig)) {
        if (component.aditorConfig.class.prototype instanceof AditorChildNode || component.aditorConfig.class === AditorChildNode) {
            component.aditorConfig.styleRules = defaultChildrenStyle
        } else {
            component.aditorConfig.styleRules = defaultLeafStyle
        }
    }

}

registerComponent(aditor.name, aditor)
registerComponent(aditorParagraph.name, aditorParagraph)
registerComponent(aditorText.name, aditorText)

export function renderAditorFromJSON(json: any) {
    const docView = new AditorDocView()
    const docState = new AditorDocState()
    docState.loadJSON2ANode(json)
    const vNode = renderComponentFromNode(docState.root, docView, components)
    docView.init(docState, vNode)

    return docView
}


export {
    AditorDocState,
    AditorDocView,
    docStruct
}
export type { NodeSelectionType };

