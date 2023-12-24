// dynamicRender.ts
import { h } from 'vue'
import { AditorChildNode, AditorLeafNode } from './nodes'
import type { VNode } from 'vue'
import { AditorDocState, AditorDocView } from '.'

export const components: { [key: string]: any } = {}

export function registerComponent(name: string, component: any) {
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
  components[name] = component
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



export function str2AditorDocJson(htmlString: string) {
  var parser = new DOMParser();

  // 使用DOMParser的parseFromString方法将字符串解析为DOM
  var doc = parser.parseFromString(htmlString, 'text/html');
  console.log(parseChildNodes(doc.body.childNodes))

}

function parseNode(node: Node): any {
  if (node == null)
    return null
  if (node.nodeType === Node.TEXT_NODE) {
    // 解析文本节点
    return {
      name: BASE_RENDER.parse_hash.span,
      data: {
        text: node.textContent!.trim()
      }
    };
  } else if (node.nodeType === Node.ELEMENT_NODE) {

    var tagName = (node as HTMLElement).tagName.toLowerCase();
    switch (tagName) {
      case 'div':
        return {
          name: BASE_RENDER.parse_hash.div,
          children: parseChildNodes(node.childNodes),
          style: convertStyleString((node as HTMLElement).getAttribute('style'), components[BASE_RENDER.parse_hash.div].aditorConfig.styleRules),
          data: {}
        };
      case 'span':
        return {
          name: BASE_RENDER.parse_hash.span,
          style: convertStyleString((node as HTMLElement).getAttribute('style'), components[BASE_RENDER.parse_hash.div].aditorConfig.styleRules),
          data: {
            text: node.textContent!.trim()
          },
        };
      default:
        return null;
    }
  } else {
    return null;
  }
}

function parseChildNodes(childNodes: NodeListOf<ChildNode>): any {
  var result = [];
  for (var i = 0; i < childNodes.length; i++) {
    var childNode = childNodes[i];
    var parsedNode = parseNode(childNode);
    if (parsedNode !== null) {
      result.push(parsedNode);
    }
  }
  return result;
}

function convertStyleString(styleStr: string, validKey: string[]) {
  if (!styleStr) {
    return {};
  }
  const keyValuePairs = styleStr.split(';');
  const result = {};

  for (let i = 0; i < keyValuePairs.length; i++) {
    const pair = keyValuePairs[i].trim();
    const match = pair.match(/^([^:]+):(.+)$/);
    if (match && validKey.includes(match[1].trim())) {
      result[match[1].trim()] = match[2].trim();
    }
  }

  return result;
}

const BASE_RENDER = {
  parse_hash: {
    "div": "aditorParagraph",
    "span": "aditorText"
  }
}