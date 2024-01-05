// dynamicRender.ts
import { h } from 'vue'
import type { VNode } from 'vue'
import { AditorChildNode, AditorLeafNode, ANodeType } from './nodes'
import { AditorDocView, docStruct, type AditorComponent } from '.'
import {logger} from './log'

export function renderComponentFromNode(aNode: AditorChildNode | AditorLeafNode, docView: AditorDocView, components: { [key: string]: AditorComponent }): VNode {

  const component = components[aNode.name]
  if (!component) {
    throw new Error(`Component ${aNode.name} not found`)
  }

  if (aNode instanceof AditorLeafNode) {
    return h(component, {
      aNode,
      docView,
      key: aNode.virtualId,
      aditorId: `_aditor-${aNode.start}`,
    })
  } else if (aNode instanceof AditorChildNode) {
    return h(component, {
      aNode,
      docView,
      key: aNode.virtualId,
      aditorId: `_aditor-${aNode.start}`,
    }, () => aNode.children.map(child => renderComponentFromNode(child, docView, components)))
  } else {
    throw new Error(`Component must be leaf or child node`)
  }

}

/**
 * Parse Str to AditorDocJson
 * @param htmlString
 * @returns
 **/
export function str2AditorDocJson(htmlString: string):docStruct[] {
  const parser = new Parser()
  const doc = parser.parse(htmlString)
  return doc
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

type HTMLNode = {
  type: string,
  tagName: string,
  tagType: TAG_TYPE_ENUM,
  style?: any,
  _style?: any,
  children?: HTMLNode[]
  value?: string
}

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
  getNextToken():{type: string, value: string}{
    // To Complete
    if(!this.hasMoreTokens()){
      return {
        type: "END",
        value: ""
      }
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
  _lookahead: {type: string, value: string} = {type: "START", value: ""}

  _nodeStack: HTMLNode[] = []
  _styleStack: any[] = []

  // aditorState
  _aditorStateStack: AditorState[] = [new AditorState()]
  _aditorNodeStack: docStruct[] = []

  constructor(){
    this._tokenizer = new Tokenizer()
  }
  parse(htmlString: string){
    this._tokenizer.init(htmlString)
    // To Complete
    this._lookahead = this._tokenizer.getNextToken()
    this.HTML()
    return this._aditorNodeStack
  }

  /**
   * HTML
   * | HTMLNodeList
   */
  HTML(){
    this._nodeStack.push({
      type: "root",
      tagName: "root",
      tagType: converTagType("root"),
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
    while(this._lookahead.type != "END"){
      this.HTMLNode()
    }
  }

  /**
   * HTMLNode
   * | SelfCloseNode
   * | NormalNode
   * | ContentNode
   */
  HTMLNode(){
    const token = this._lookahead
    switch (token.type) {
      case "TAG_NAME":
        if(this._isSelfClosingTag(token.value)){
          return this.SelfCloseNode()
        }else{
          return this.NormalNode()
        }
      case "CONTENT":
        return this.ContentNode()
      default:
          throw new Error(`Unexpected token at ${this._tokenizer._cursor}, expect TAG_NAME or CONTENT but get ${token?.type}`)
    }
  }

  /** NormalNode
   * | TAG_NAME Attributes NodeLists TAG_CLOSE -> TAG_NAME Attributes HTMLNode HTMLNode HTMLNode ... HTMLNode TAG_CLOSE
   * | TAG_NAME Attributes TAG_CLOSE
   */
  NormalNode(){
    const token = this._lookahead
    if(token?.type == "TAG_NAME"){
      const tagName = this._eat("TAG_NAME").value
      const style = this._mergeStyle(this._currentStyle(), this.Attributes()["style"])
      const _style = converStyleStringAll(this.Attributes()["style"])
      const currentNode = {
        type: "htmlNode",
        tagName,
        tagType: converTagType(tagName, _style["display"]),
        style,
        children: []
      }
      const parentNode = this._currentNode()
      if(parentNode.children){
        parentNode.children.push(currentNode)
        if(this._lookahead?.type == "TAG_CLOSE"){
          this.aditorParse(this._aditorCurrentState(), currentNode)
          this._eat("TAG_CLOSE")
          this._aditorStateStack.pop()
        }else{
          this._styleStack.push(style)
          this._nodeStack.push(currentNode)
          this.aditorParse(this._aditorCurrentState(), currentNode)
          do{
            this.HTMLNode()
          }while(this._lookahead!.type != "TAG_CLOSE")
          this._eat("TAG_CLOSE")
          this._nodeStack.pop()
          this._styleStack.pop()
          this._aditorStateStack.pop()
        }
        return 
      }else{
        throw new Error(`parentNode has no children at ${this._tokenizer._cursor}`)
      }
    }
    throw new Error(`Unexpected token at ${this._tokenizer._cursor}`)    
  }
  

  /** SelfCloseNode
   *  | TAG_NAME Attributes
   */
  SelfCloseNode(){
    // get current nodeStack length
    const parentNode = this._currentNode()

    const token = this._lookahead
    if(token?.type == "TAG_NAME"){
      const tagName = token.value
      this._eat("TAG_NAME")
      const style = this._mergeStyle(this._currentStyle(), this.Attributes()["style"])
      // inherit parent node style 
      const currentNode = {
        type: "SelfCloseNode",
        tagName,
        tagType: converTagType(tagName),
        style
      }
      this.aditorParse(this._aditorCurrentState(), currentNode)
      if(parentNode.children){
        parentNode.children.push(currentNode)
        this._aditorStateStack.pop()
      }else{
        throw new Error(`parentNode has no children at ${this._tokenizer._cursor}`)
      }
    }else{
      throw new Error(`Unexpected token at ${this._tokenizer._cursor}`)
    }
  }

  
  /**
   * ContentNode
   * | CONTENT
   */
  ContentNode(){  
    const parentNode = this._currentNode()
    const value = htmlspecialcharsDecode(this._eat("CONTENT").value)
    // Todo: replace \n \r and \r\n to ' '
    // const value = htmlspecialcharsDecode(this._eat("CONTENT").value).replace(/\r\n|\n|\r/g, ' ')
    const currentNode = {
      type: "content",
      tagName: "content",
      tagType: converTagType("content"),
      style: this._currentStyle(),
      value
    }
    if(parentNode.children){
      parentNode.children.push(currentNode)
    }else{
      throw new Error(`parentNode has no children at ${this._tokenizer._cursor}`)
    }
    this.aditorParse(this._aditorCurrentState(), currentNode)
    this._aditorStateStack.pop()
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
          attributes[key] = convertStyleString(value, SUPPORT_STYLE_KEY)
        }
      }
      // other situation is not support;like 'embedded' identifier
      nextTokenType = this._lookahead?.type
    }
    return attributes

  }
  
  _isSelfClosingTag(tagName: string){
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

  aditorParse(currentState: AditorState, nextNode: HTMLNode){
    if(currentState.name in this){
      this._aditorStateStack.push(this._aditorStateTrans(this._aditorCurrentState().name, nextNode.tagType))
      this[currentState.name](nextNode)
      return 
    }
    throw new Error(`Unexpected state ${currentState}`)
  }
  
  _aditorStateTrans(state:ADITOR_STATE_ENUM, nodeTag: TAG_TYPE_ENUM){
    if(state in ADIOTR_STATE_TABLE){
      if(nodeTag in ADIOTR_STATE_TABLE[state]){
        const name = ADIOTR_STATE_TABLE[state][nodeTag]
        return new AditorState(name)
      }
    }
    throw new Error(`Current State${this._aditorCurrentState().name}, Unexpected state ${state}`)
  }

  START_ADIOTR_CALL(nextNode: HTMLNode){
    if(nextNode.tagType == TAG_TYPE_ENUM.BREAK){
      this._aditorNodeStack.push(this.makeAditorDocJson(nextNode))
    }else if(nextNode.tagType == TAG_TYPE_ENUM.TEXT){
      this._aditorNodeStack.push(this.makeAditorDocJson(nextNode))
    }else{
      logger.debug(`Current state ${this._aditorCurrentState().name}, take ${nextNode.tagName}; do nothing`)
    }
  }
  
  PARAGRAPH_ADIOTR_CALL(nextNode: HTMLNode){
    if(nextNode.tagType == TAG_TYPE_ENUM.BREAK){
      this._aditorNodeStack.push(this.makeAditorDocJson(nextNode))
    }else if(nextNode.tagType == TAG_TYPE_ENUM.TEXT){
      const currentNode = this._aditorCurrentNode()
      if(currentNode && currentNode.children){
        currentNode.children.push(this.makeAditorDocJson(nextNode))
      }else{
        this._aditorNodeStack.push(this.makeAditorDocJson(nextNode))
        logger.warn(`Current state ${this._aditorCurrentState().name}, take ${nextNode.tagName}; but current node is not a child node`)
        // throw new Error(`Current state ${this._aditorCurrentState().name}, take ${nextNode.tagName}; but current node is not a child node`)
      }
    }else{
      logger.debug(`Current state ${this._aditorCurrentState().name}, take ${nextNode.tagName}; do nothing`)
    }
  }

  TEXT_ADIOTR_CALL(nextNode: HTMLNode){
    if(nextNode.tagType == TAG_TYPE_ENUM.BREAK){
      this._aditorNodeStack.push(this.makeAditorDocJson(nextNode))
    }else if(nextNode.tagType == TAG_TYPE_ENUM.TEXT){
      this._aditorNodeStack.push(this.makeAditorDocJson(nextNode))
    }else{
      logger.debug(`Current state ${this._aditorCurrentState().name}, take ${nextNode.tagName}; do nothing`)
    }
  }

  CODE_ADIOTR_CALL(nextNode: HTMLNode){
    if(nextNode.tagType == TAG_TYPE_ENUM.BREAK){
      logger.debug("Not implement state CODE->BREAK yet")
    }else if(nextNode.tagType == TAG_TYPE_ENUM.TEXT){
      logger.debug("Not implement state CODE->TEXT yet")
    }else{
      logger.debug(`Current state ${this._aditorCurrentState().name}, take ${nextNode.tagName}; do nothing`)
    }
  }

  TABLE_ADIOTR_CALL(nextNode: HTMLNode){
    if(nextNode.tagType == TAG_TYPE_ENUM.BREAK){
      logger.debug("Not implement state TABLE->BREAK yet")
    }else if(nextNode.tagType == TAG_TYPE_ENUM.TEXT){
      logger.debug("Not implement state TABLE->TEXT yet")
    }else{
      logger.debug(`Current state ${this._aditorCurrentState().name}, take ${nextNode.tagName}; do nothing`)
    }
  }

  OTHER_ADIOTR_CALL(nextNode: HTMLNode){
    if(nextNode.tagType == TAG_TYPE_ENUM.BREAK){
      this._aditorNodeStack.push(this.makeAditorDocJson(nextNode))
    }else if(nextNode.tagType == TAG_TYPE_ENUM.TEXT){
      this._aditorNodeStack.push(this.makeAditorDocJson(nextNode))
    }else{
      logger.debug(`Current state ${this._aditorCurrentState().name}, take ${nextNode.tagName}; do nothing`)
    }
  }

  _aditorCurrentState(){
    return this._aditorStateStack[this._aditorStateStack.length - 1]
  }

  _aditorCurrentNode(){
    return this._aditorNodeStack[this._aditorNodeStack.length - 1]
  }

  makeAditorDocJson(nextNode: HTMLNode): docStruct{
    if(nextNode.tagType === TAG_TYPE_ENUM.BREAK){
      this._clearEmptyAditorParagraph()
      return {
        name: 'aditorParagraph',
        type: ANodeType.Child,
        style: nextNode.style,
        children: [],
        data:{}
      }
    }else if(nextNode.tagType === TAG_TYPE_ENUM.TEXT){
      return {
        name:'aditorText',
        type: ANodeType.Leaf,
        style: nextNode.style,
        data:{
          text: nextNode.value
        }
      }
    }else{
      throw new Error(`Unexpected aditor component name ${name}`)
    }
  }
  
  _clearEmptyAditorParagraph(){
    const currentNode = this._aditorCurrentNode()
    if(currentNode == undefined){
      return 
    }
    if(currentNode instanceof AditorChildNode){
      if(currentNode.children.length == 0){
        this._aditorNodeStack.pop()
      }
    }
  }
}

const enum ADITOR_STATE_ENUM{
  START='START_ADIOTR_CALL',
  PARAGRAPH='PARAGRAPH_ADIOTR_CALL',
  TEXT='TEXT_ADIOTR_CALL',
  CODE='CODE_ADIOTR_CALL',
  TABLE='TABLE_ADIOTR_CALL',
  OTHER='OTHER_ADIOTR_CALL'
}

const enum TAG_TYPE_ENUM{
  BREAK='break',
  INLINE='inline',
  TEXT='_text_',
  CODE='code',
  TABLE='table',
  OTHER='other'
}

const ADIOTR_STATE_TABLE:{[key: string]: {[key:string]: ADITOR_STATE_ENUM}} = {
  [ADITOR_STATE_ENUM.START]: {
    [TAG_TYPE_ENUM.BREAK]: ADITOR_STATE_ENUM.PARAGRAPH,
    [TAG_TYPE_ENUM.INLINE]: ADITOR_STATE_ENUM.TEXT,
    [TAG_TYPE_ENUM.TEXT]: ADITOR_STATE_ENUM.TEXT,
    [TAG_TYPE_ENUM.CODE]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.TABLE]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.OTHER]: ADITOR_STATE_ENUM.OTHER
  },
  [ADITOR_STATE_ENUM.PARAGRAPH]: {
    [TAG_TYPE_ENUM.BREAK]: ADITOR_STATE_ENUM.PARAGRAPH,
    [TAG_TYPE_ENUM.INLINE]: ADITOR_STATE_ENUM.PARAGRAPH,
    [TAG_TYPE_ENUM.TEXT]: ADITOR_STATE_ENUM.PARAGRAPH,
    [TAG_TYPE_ENUM.CODE]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.TABLE]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.OTHER]: ADITOR_STATE_ENUM.OTHER
  },
  [ADITOR_STATE_ENUM.TEXT]: {
    [TAG_TYPE_ENUM.BREAK]: ADITOR_STATE_ENUM.PARAGRAPH,
    [TAG_TYPE_ENUM.INLINE]: ADITOR_STATE_ENUM.TEXT,
    [TAG_TYPE_ENUM.TEXT]: ADITOR_STATE_ENUM.TEXT,
    [TAG_TYPE_ENUM.CODE]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.TABLE]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.OTHER]: ADITOR_STATE_ENUM.OTHER
  },
  [ADITOR_STATE_ENUM.CODE]: {
    [TAG_TYPE_ENUM.BREAK]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.INLINE]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.TEXT]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.CODE]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.TABLE]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.OTHER]: ADITOR_STATE_ENUM.CODE
  },
  [ADITOR_STATE_ENUM.TABLE]: {
    [TAG_TYPE_ENUM.BREAK]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.INLINE]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.TEXT]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.CODE]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.TABLE]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.OTHER]: ADITOR_STATE_ENUM.TABLE
  },
  [ADITOR_STATE_ENUM.OTHER]: {
    [TAG_TYPE_ENUM.BREAK]: ADITOR_STATE_ENUM.PARAGRAPH,
    [TAG_TYPE_ENUM.INLINE]: ADITOR_STATE_ENUM.PARAGRAPH,
    [TAG_TYPE_ENUM.TEXT]: ADITOR_STATE_ENUM.PARAGRAPH,
    [TAG_TYPE_ENUM.CODE]: ADITOR_STATE_ENUM.CODE,
    [TAG_TYPE_ENUM.TABLE]: ADITOR_STATE_ENUM.TABLE,
    [TAG_TYPE_ENUM.OTHER]: ADITOR_STATE_ENUM.OTHER
  }
}

class AditorState{
  name: ADITOR_STATE_ENUM = ADITOR_STATE_ENUM.START
  sec_name: string = ""
  constructor(name?: ADITOR_STATE_ENUM){
    this.name = name || ADITOR_STATE_ENUM.START
  }
}

const NODETAG_HASH: { [key: string]: TAG_TYPE_ENUM } = {
  'br': TAG_TYPE_ENUM.BREAK,
  'div': TAG_TYPE_ENUM.BREAK,
  'p': TAG_TYPE_ENUM.BREAK,
  'h1': TAG_TYPE_ENUM.BREAK,
  'h2': TAG_TYPE_ENUM.BREAK,
  'h3': TAG_TYPE_ENUM.BREAK,
  'h4': TAG_TYPE_ENUM.BREAK,
  'h5': TAG_TYPE_ENUM.BREAK,
  'h6': TAG_TYPE_ENUM.BREAK,
  'hr': TAG_TYPE_ENUM.BREAK,
  'ul': TAG_TYPE_ENUM.BREAK,
  'li': TAG_TYPE_ENUM.BREAK,
  'ol': TAG_TYPE_ENUM.BREAK,
  'span': TAG_TYPE_ENUM.INLINE,
  'a': TAG_TYPE_ENUM.INLINE,
  'b': TAG_TYPE_ENUM.INLINE,
  'i': TAG_TYPE_ENUM.INLINE,
  'u': TAG_TYPE_ENUM.INLINE,
  'em': TAG_TYPE_ENUM.INLINE,
  'strong': TAG_TYPE_ENUM.INLINE,
  'small': TAG_TYPE_ENUM.INLINE,
  'sub': TAG_TYPE_ENUM.INLINE,
  'sup': TAG_TYPE_ENUM.INLINE,
  'mark': TAG_TYPE_ENUM.INLINE,
  'ruby': TAG_TYPE_ENUM.INLINE,
  'rt': TAG_TYPE_ENUM.INLINE,
  'rp': TAG_TYPE_ENUM.INLINE,
  'bdi': TAG_TYPE_ENUM.INLINE,
  'bdo': TAG_TYPE_ENUM.INLINE,
  'wbr': TAG_TYPE_ENUM.INLINE,
  'cite': TAG_TYPE_ENUM.INLINE,
  'font': TAG_TYPE_ENUM.INLINE,
  'pre': TAG_TYPE_ENUM.CODE,
  'code': TAG_TYPE_ENUM.CODE,
  'table': TAG_TYPE_ENUM.TABLE,
  'caption': TAG_TYPE_ENUM.TABLE,
  'colgroup': TAG_TYPE_ENUM.TABLE,
  'col': TAG_TYPE_ENUM.TABLE,
  'tbody': TAG_TYPE_ENUM.TABLE,
  'thead': TAG_TYPE_ENUM.TABLE,
  'tfoot': TAG_TYPE_ENUM.TABLE,
  'tr': TAG_TYPE_ENUM.TABLE,
  'td': TAG_TYPE_ENUM.TABLE,
  'th': TAG_TYPE_ENUM.TABLE
}

function converTagType(tagName: string, display:string|undefined=undefined): TAG_TYPE_ENUM{
  // use style 'display' to override if exist
  if(display){
    if(['block', 'flex', 'grid', 'table'].includes(display)){
      return TAG_TYPE_ENUM.BREAK
    }else if(['inline', 'inline-block', 'inline-flex', 'inline-grid', 'inline-table'].includes(display)){
      return TAG_TYPE_ENUM.INLINE
    }else{
      return TAG_TYPE_ENUM.OTHER
    }
  }

  if(tagName === 'content'){
    return TAG_TYPE_ENUM.TEXT
  }else if(tagName === 'root'){
    return TAG_TYPE_ENUM.OTHER
  }else{
    const type = NODETAG_HASH[tagName]
    if(type == undefined){
      return TAG_TYPE_ENUM.OTHER
    }
    return type
  }
}

const replacements: Record<string, string> = {
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
};

// escape special tag
function htmlspecialcharsDecode(str: string) {
  return str.replace(/&quot;|&amp;|&lt;|&gt;|&nbsp;/g, (match) => replacements[match]);
}

// Paste Render support style key name list
const SUPPORT_STYLE_KEY = ["color", "font-size", "font-weight", "text-decoration", "background-color", "text-align"]

function convertStyleString(styleStr: string | null, validKey: string[] = SUPPORT_STYLE_KEY) {
  if (!styleStr) {
    return {};
  }
  if (!validKey) {
    validKey = [];
  }

  const formatStr = htmlspecialcharsDecode(styleStr);
  const keyValuePairs = formatStr.split(';');
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

function converStyleStringAll(styleStr: string | null){
  if (!styleStr) {
    return {};
  }

  const formatStr = styleStr.replace(/&(quot|amp|lt|gt|nbsp);/g, (match) => replacements[match]);
  const keyValuePairs = formatStr.split(';');
  const result: Record<string, string> = {};

  for (let i = 0; i < keyValuePairs.length; i++) {
    const pair = keyValuePairs[i].trim();
    const match = pair.match(/^([^:]+):(.+)$/);
    if (match) {
      result[match[1].trim()] = match[2].trim();
    }
  }
  return result;
}