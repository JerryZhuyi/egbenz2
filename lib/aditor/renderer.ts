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
  const parser = new Parser()
  parser.parse(htmlString)
  console.log("Rules not complete, print detail in renderer.ts for debug")
  console.log(htmlString)
  // console.log(aditorDoc)
}


// //////////////////////////////////////////////// //
// //////////////////////////////////////////////// //
// Below is a simple Tokenizer&Parser achieve       //
// Todo: Move to an independent unit                // 
// //////////////////////////////////////////////// //
// //////////////////////////////////////////////// //

// HTMLDOM Tokenizer Regex Spec
const Spec:[RegExp, string][] = [
  [/^<!--/, "COMMENT_START"],
  [/^-->/, "COMMENT_END"],
  [/^<!\[CDATA\[/, "CDATA_START"],
  [/^\]\]>/, "CDATA_END"],
  [/^<\//, "TAG_CLOSE"],
  [/^</, "TAG_OPEN"],
  [/^>/, "TAG_END"],
  [/^\s+/, "WHITESPACE"],
  [/^[\w-]+/, "IDENTIFIER"],
  [/^"([^"]*)"/, "STRING"],
  [/^'([^']*)'/, "STRING"],
  [/^=/, "EQUALS"],
  // last nothing match should be content
  [/^[^<]+/, "IDENTIFIER"]
]

class Tokenizer{
  _string: string = ""
  _cursor: number = 0
  constructor(){}
  init(htmlString: string){
    this._string = htmlString
    this._cursor = 0
  }
  isEOF(){
    return this._cursor >= this._string.length
  }
  hasMoreTokens(){
    return this._cursor < this._string.length
  }
  getNextToken():{type: string, value: string}|null{
    // To Complete
    if(!this.hasMoreTokens()){
      return null
    }
    const str = this._string.slice(this._cursor)
    
    
    for(const [reg, type] of Spec){
      const tokenValue = this._match(reg, str)
      if(tokenValue === null){
        continue
      }
      return {type, value:tokenValue}
    }
    return null
  }
  _match(reg: RegExp, str: string){
    const matched = reg.exec(str)
    if(matched == null){
      return null
    }else{
      this._cursor += matched[0].length
      return matched[0]
    }
  }
}

class Parser{
  _tokenizer: Tokenizer
  _lookahead: {type: string, value: string} | null = {type: "", value: ""}

  constructor(tokenizer: Tokenizer){
    this._tokenizer = new Tokenizer()
  }
  parse(htmlString: string){
    this._tokenizer.init(htmlString)
    // To Complete
    this._lookahead = this._tokenizer.getNextToken()
    this.HTMLDom()
  }

  /**
   * HTMLDom -> HTMLTag HTMLDom | ε
   */
  HTMLDom(){
    let i = 0
    while(this._tokenizer.hasMoreTokens() && i < 10000){
      console.log(this._lookahead)
      this._lookahead = this._tokenizer.getNextToken()
      i++
    }
  }



}

function convertStyleString(styleStr: string | null, validKey: string[]) {
  if (!styleStr) {
    return {};
  }
  if(!validKey){
    validKey = []
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