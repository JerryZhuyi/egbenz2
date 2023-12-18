// dynamicRender.ts
import { h } from 'vue'
import  { AditorChildNode, AditorLeafNode } from './nodes'
import type { VNode } from 'vue'
import { AditorDocState, AditorDocView } from '.'

export const components: { [key: string]: any } = {}

export function registerComponent(name: string, component: any) {
  components[name] = component
}


export function renderComponentFromNode(aNode: AditorChildNode | AditorLeafNode, docView: AditorDocView): VNode{
  
  const component = components[aNode.name]
  if (!component) {
    throw new Error(`Component ${aNode.name} not found`)
  }
  
  if(aNode instanceof AditorLeafNode) {
    return h(component, {
      aNode,
      docView,
      key: aNode.virtualId,
      pos: `_aditor-${aNode.start}`,
    })
  }else if(aNode instanceof AditorChildNode){
    return h(component, {
      aNode,
      docView,
      key: aNode.virtualId,
      pos: `_aditor-${aNode.start}`,
    }, ()=>aNode.children.map(child => renderComponentFromNode(child, docView)))
  }else{
    throw new Error(`Component must be leaf or child node`)
  }
  
}