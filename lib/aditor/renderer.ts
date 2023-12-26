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
  console.log("Rules not complete, print detail in renderer.ts for debug")
  console.log(htmlString)
  const doc = parser.parse(htmlString)
  console.log(doc)
  // console.log(aditorDoc)
}


// //////////////////////////////////////////////// //
// //////////////////////////////////////////////// //
// Below is a simple Tokenizer&Parser achieve       //
// Todo: Move to an independent unit                // 
// //////////////////////////////////////////////// //
// //////////////////////////////////////////////// //

// HTMLDOM Tokenizer Regex Spec
// [Notice] HTMLDom is perfer to use hand write parser
// [Notice] Not use any parser generator
const Spec:[RegExp, string][] = [
  // COMMENT Skip
  [/^<!--[\s\S]*?-->/, null],
  // Whitespace Skip
  [/^\s+/, null],

  [/^<!\[CDATA\[/, "CDATA_START"],
  [/^\]\]>/, "CDATA_END"],
  //TAGName but not include < and >
  [/^<[\w\d-]+/, "TAG_NAME"],
  [/^>/, "TAG_END"],
  [/^<\//, "TAG_CLOSE"],
  
  // identifier
  [/^[\w\d-]+(?=[<>=])/, "IDENTIFIER"],
  [/^"([^"]*)"/, "STRING"],
  [/^'([^']*)'/, "STRING"],
  [/^=/, "EQUALS"],
  // last nothing match should be content
  [/^[^>]+(?=<)/, "CONTENT"],
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
    const str = this._string
    
    if(str[this._cursor] === '<'){
      let matched = ''
      if(str[this._cursor+1] === '/'){
        // skip </
        this._cursor += 2
      }else{
        this._cursor++
      }

      while(str[this._cursor] != ' ' && str[this._cursor] != '>' && str[this._cursor] != '/' && this.isEOF() == false){
        matched += str[this._cursor++]
      }
      return {type: "TAG_NAME", value: matched}

    }else if(str[this._cursor] === '/'){
      this._cursor++
      return this.getNextToken()
    }else if(str[this._cursor] === '>'){
      let matched = ''
      this._cursor++
      if(str[this._cursor] === '<'){
        return this.getNextToken()
      }else if(this.isEOF() == false){
        while(str[this._cursor] != '<' && this.isEOF() == false){
          matched += str[this._cursor++]
        }
        return {type: "CONTENT", value: matched}
      }else{
        return {
          type: "TAG_END",
          value: ""
        
        }
      }

    }else if(str[this._cursor] === ' '){
      let matched = ''
      this._cursor++
      if(str[this._cursor] === ' '){
        return this.getNextToken()
      }else{
        while(str[this._cursor] != '>' && str[this._cursor] != '=' && str[this._cursor] != ' ' && str[this._cursor] != '/' && this.isEOF() == false){
          matched += str[this._cursor++]
        }
        if(matched == '') 
          return this.getNextToken()
        return {type: "IDENTIFIER", value: matched}
      }
      return {type: "CONTENT", value: matched}

    }else if(str[this._cursor] === '='){
      this._cursor++
      return {type: "EQUALS", value: "="}

    }else if(str[this._cursor] === "'"){
      let matched = ''
      this._cursor++
      while(str[this._cursor] != "'" && this.isEOF() == false){
        matched += str[this._cursor++]
      }
      this._cursor++
      return {type: "STRING", value: matched}

    }else if(str[this._cursor] === '"'){
      let matched = ''
      this._cursor++
      while(str[this._cursor] != '"' && this.isEOF() == false){
        matched += str[this._cursor++]
      }
      this._cursor++
      return {type: "STRING", value: matched}
    }

    throw new Error(`Unexpected token at ${this._cursor}`)

  }

  /**
   * Method abandon
   * @param reg 
   * @param str 
   * @returns 
   */
  _matchRegex(reg: RegExp, str: string){
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

  constructor(){
    this._tokenizer = new Tokenizer()
  }
  parse(htmlString: string){
    this._tokenizer.init(htmlString)
    // To Complete
    this._lookahead = this._tokenizer.getNextToken()
    return this.HTML()
  }

  /**
   * HTML
   * | HTMLNode HTML -> HTMLNode HTMLNode HTMLNode
   */
  HTML(){
    return this.HTMLNodeList()
  }

  HTMLNodeList(){
    const htmlNodeList = []
    while(!(this._lookahead == null)){
      htmlNodeList.push(this.HTMLNode())
    }
    return htmlNodeList
  }

  /**
   * HTMLNode
   * | TAG_NAME 
   * | TAG_NAME IDENTIFIER EQUALS STRING HTMLNode TAG_END 
   * | TAG_NAME TAG_NAME 
   * | TAG_NAME TAG_END CONTENT TAG_NAME TAG_CLOSE
   */
  HTMLNode(){
    const token = this._lookahead
    console.log(token)
    this._lookahead = this._tokenizer.getNextToken()
  }


  _eat(type: string){
    const token = this._lookahead
    if(token == null){
      throw new Error(`Unexpected end of input at ${this._tokenizer._cursor}, expect ${type}`)
    }
    if(type !== token.type){
      throw new Error(`Unexpected token at ${this._tokenizer._cursor}, expect ${type} but get ${token.type}`)
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