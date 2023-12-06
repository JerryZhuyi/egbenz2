// dynamicRender.ts
import { h } from 'vue'

export const components: { [key: string]: any } = {}

export function registerComponent(name: string, component: any) {
  components[name] = component
}

export function renderComponentFromJSON(json: any) {
  const { name, props, children } = json

  const component = components[name]
  if (!component) {
    throw new Error(`Component ${name} not found`)
  }

  return h(component, props, children)
}