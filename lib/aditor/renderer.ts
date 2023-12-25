// dynamicRender.ts
import { h, Component } from 'vue'
import { AditorChildNode, AditorLeafNode, ANodeType } from './nodes'
import type { VNode } from 'vue'
import { AditorDocState, AditorDocView, docStruct } from '.'

export type AditorConfigType = {
  type: "child" | "leaf"
  styleRules: string[]
}
type AditorComponent = Component & { aditorConfig: AditorConfigType }

export const components: { [key: string]: AditorComponent } = {}

export function registerComponent(name: string, component: any) {
  setComponentsDefaultConfig(component)
  components[name] = component
}

function setComponentsDefaultConfig(component: any) {
  const defaultChildrenStyle = ['color', 'font-size', 'font-weight', 'font-family', 'text-decoration', 'background-color', 'text-align']
  const defaultLeafStyle = ['color', 'font-size', 'font-weight', 'font-family', 'text-decoration', 'background-color']

  if (!("aditorConfig" in component)) {
    component.aditorConfig = {
      type: "child",
    }
  }
  if (!("styleRules" in component.aditorConfig)) {
    if (component.aditorConfig.type == "child") {
      component.aditorConfig.styleRules = defaultChildrenStyle
    } else {
      component.aditorConfig.styleRules = defaultLeafStyle
    }
  }
}


export function renderComponentFromNode(aNode: AditorChildNode | AditorLeafNode, docView: AditorDocView): VNode {

  const component = components[aNode.name]
  if (!component) {
    throw new Error(`Component ${aNode.name} not found`)
  }

  if (aNode instanceof AditorLeafNode) {
    return h(component, {
      aNode,
      docView,
      key: aNode.virtualId,
      pos: `_aditor-${aNode.start}`,
    })
  } else if (aNode instanceof AditorChildNode) {
    return h(component, {
      aNode,
      docView,
      key: aNode.virtualId,
      pos: `_aditor-${aNode.start}`,
    }, () => aNode.children.map(child => renderComponentFromNode(child, docView)))
  } else {
    throw new Error(`Component must be leaf or child node`)
  }

}

/**
 * Parse Str to AditorDocJson
 * @param htmlString
 * @returns
 **/
export function str2AditorDocJson(htmlString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const aditorDoc = parseHTMLDom2AditorDocJson(doc.body.childNodes)
  console.log("Rules not complete, print detail in renderer.ts for debug")
  console.log(doc)
  console.log(aditorDoc)
}

/**
 * use StateMechine to parse HTMLDom to AditorDocJson
 * @param node 
 */
function parseHTMLDom2AditorDocJson(node: NodeListOf<ChildNode>):docStruct {
  const state = new StateMechine()
  state.parse(node)
  return {
    name: "aditor",
    type: ANodeType.Child,
    children: [],
    style: {},
    data:{}
  }
}

enum PARSE_STATE{
  init="init",
}



class StateMechine{
  state: string
  pathStack: string[] = []
  pathStyleStack: string[] = []
  pos: number = 0
  constructor(){
    this.state = "init"
  }
  parse(node: NodeListOf<ChildNode>){
    for(let i in node){
      const child = node[i] as HTMLElement
      if(child?.childNodes?.length>0){
        this.parse(child.childNodes)
      }
      console.log(child.tagName)
    }
  }
}

function convertStyleString(styleStr: string | null, validKey: string[]) {
  if (!styleStr) {
    return {};
  }
  const keyValuePairs = styleStr.split(';');
  const result: Record<string, string> = {};

  for (let i = 0; i < keyValuePairs.length; i++) {
    const pair = keyValuePairs[i].trim();
    const match = pair.match(/^([^:]+):(.+)$/);
    if (match && validKey.includes(match[1].trim())) {
      result[match[1].trim()] = match[2].trim();
    }
  }
  return result;
}

const parseHash = {
  "div": "aditorParagraph",
  "span": "aditorText"
}