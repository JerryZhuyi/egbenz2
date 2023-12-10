// dynamicRender.ts
import { h } from 'vue'
import  { AditorChildNode, AditorLeafNode } from './nodes'
import type { VNode } from 'vue'

export const components: { [key: string]: any } = {}

export function registerComponent(name: string, component: any) {
  components[name] = component
}


export function renderComponentFromNode(aNode: AditorChildNode | AditorLeafNode): VNode{
  
  const component = components[aNode.name]
  if (!component) {
    throw new Error(`Component ${aNode.name} not found`)
  }
  
  if(aNode instanceof AditorLeafNode) {
    return h(component, {
      aNode,
      key: aNode.virtualId,
      id: `_aditor-${aNode.id}`,
    })
  }else if(aNode instanceof AditorChildNode){
    return h(component, {
      aNode,
      key: aNode.virtualId,
      id: `_aditor-${aNode.id}`,
    }, ()=>aNode.children.map(child => renderComponentFromNode(child )))
  }else{
    throw new Error(`Component must be leaf or child node`)
  }
  
}