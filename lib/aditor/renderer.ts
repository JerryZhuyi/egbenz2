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
      let tagType = ''
      if(str[this._cursor+1] === '/'){
        // skip </
        this._cursor += 2
        tagType = "TAG_CLOSE"
      }else{
        this._cursor++
        tagType = "TAG_NAME"
      }

      while(str[this._cursor] != ' ' && str[this._cursor] != '>' && str[this._cursor] != '/' && this.isEOF() == false){
        matched += str[this._cursor++]
      }
      return {type: tagType, value: matched}

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
          type: "END",
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

  _nodeStack: any[] = []
  _styleStack: any[] = []
  
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
   * | HTMLNodeList
   */
  HTML(){
    this._nodeStack.push({
      type: "root",
      tagName: "root",
      children: []
    })
    this.HTMLNodeList()
    return this._nodeStack
  }

  /**
   * HTMLNodeList
   * | HTMLNode HTMLNodeList -> HTMLNode HTMLNode ... HTMLNode
   * @returns 
   */
  HTMLNodeList(){
    while(!(this._lookahead == null) && this._lookahead.type != "END" && this._lookahead.type != "TAG_CLOSE"){
      this.HTMLNode()
    }
  }

  /**
   * HTMLNode
   * | selfClosingNode
   * | normalNode
   * | content
   */
  HTMLNode(){
    const token = this._lookahead
    if(token?.type == "TAG_NAME"){
      if(this.isSelfClosingTag(token.value)){
        return this.selfClosingNode()
      }else{
        return this.normalNode()
      }
    }else if(token?.type == "CONTENT"){
      const parentNode = this._currentNode()
      const value = this._eat("CONTENT").value
      parentNode.children.push({
        type: "content",
        tagName: "content",
        value
      })
      return
    }
    
    throw new Error(`Unexpected token at ${this._tokenizer._cursor}, expect TAG_NAME or CONTENT but get ${token?.type}`)
    
  }

  /** normalNode
   * | tagName Attributes HTMLNodeList tagClose
   * | tagName Attributes tagClose
   */
  normalNode(){
    const token = this._lookahead
    if(token?.type == "TAG_NAME"){
      const tagName = this._eat("TAG_NAME").value
      const attributes = this.Attributes()
      if(this._lookahead?.type == "TAG_CLOSE"){
        this._eat("TAG_CLOSE")
        this._currentNode().children.push({
          type: "nodeTag",
          tagName,
          attributes,
          children: []
        })
      }else{
        if(this._nodeStack.length >= 2){
          const children:any = this.HTMLNodeList()
          this._eat("TAG_CLOSE")
          this._currentNode().children.push({
            type: "nodeTag",
            tagName,
            attributes,
            children
          })
        }else{
          const parentNode = this._currentNode()
          const newNode = {
            type: "nodeTag",
            tagName,
            attributes,
            children:[]
          }
          parentNode.children.push(newNode)
          this._nodeStack.push(newNode)
          this.HTMLNodeList()
          this._eat("TAG_CLOSE")
          this._nodeStack.pop()
        }
      }
    }else{
      throw new Error(`Unexpected token at ${this._tokenizer._cursor}`)
    }
  }
  

  /** selfClosingNode
   *  | tagName Attributes
   */
  selfClosingNode(){
    // get current nodeStack length
    const parentNode = this._currentNode()

    const token = this._lookahead
    if(token?.type == "TAG_NAME"){
      const tagName = token.value
      this._eat("TAG_NAME")
      const styles = this._mergeStyle(this._currentStyle(), this.Attributes()["style"])
      // inherit parent node style 
      parentNode.children.push({
        type: "selfClosingNode",
        tagName,
        styles
      })
    }else{
      throw new Error(`Unexpected token at ${this._tokenizer._cursor}`)
    }
  }

  /**
   * Attributes
   * | Identifier = String Attributes
   * | Identifier
   */
  Attributes(){
    const attributes: {[key: string]: any} = {} // Add index signature to allow indexing with a string key
    let nextTokenType = this._lookahead?.type 
    while(nextTokenType == "IDENTIFIER"){
      const key = this._eat("IDENTIFIER").value
      if(this._lookahead?.type == "EQUALS"){
        this._eat("EQUALS")
        const value = this._eat("STRING").value
        if(key === 'style'){
          attributes[key] = convertStyleString(value, ["color", "font-size", "font-weight", "font-family", "text-decoration", "background-color", "text-align"])
        }
      }
      // other situation is not support;like 'embedded' identifier
      nextTokenType = this._lookahead?.type
    }
    return attributes

  }
  
  isSelfClosingTag(tagName: string){
    const selfTagList = ["br", "img", "hr", "input", "meta", "link", "base", "area", "embed", "param", "source", "track", "wbr"]
    return selfTagList.includes(tagName)
  }

  _eat(type: string){
    const token = this._lookahead
    if(token == null){
      throw new Error(`Unexpected end of input at ${this._tokenizer._cursor}, expect ${type}`)
    }
    if(type !== token.type){
      throw new Error(`Unexpected token at ${this._tokenizer._cursor}, expect ${type} but get ${token.type}, value: ${token.value}`)
    }

    this._lookahead = this._tokenizer.getNextToken()

    return token
  }

  _currentNode(){
    return this._nodeStack[this._nodeStack.length - 1]
  }
  _currentStyle(){
    return this._styleStack[this._styleStack.length - 1]
  }
  
  _mergeStyle(parentStyle:any, style: any){
    const newStyle:{[key: string]: any} = {}
    for(const key in parentStyle){
      newStyle[key] = parentStyle[key]
    }
    for(const key in style){
      newStyle[key] = style[key]
    }
    return newStyle
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