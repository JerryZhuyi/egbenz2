import { AditorDocView } from "./views"
import {NodeSelectionType} from "./nodes"

export type VirtualSelection = {
    start: number
    startOffset: number
    end: number
    endOffset: number
}

export class VirtualSelections{
    selections: VirtualSelection[] = []
    lastSelections: VirtualSelection[] = []
    constructor(){}
    updateSelections(){
        this.lastSelections = this.selections
        this.selections = getCurDOMSelection()
    }
    setSelectionsByNodeSelection(nodesSelection: NodeSelectionType[]){
        this.lastSelections = this.selections
        this.selections = []
        nodesSelection.forEach(nodeSelection => {
            if(nodeSelection.startNode == null || nodeSelection.endNode == null){
                return
            }

            const vsel:VirtualSelection = {
                start: nodeSelection.startNode.start,
                startOffset: nodeSelection.startOffset,
                end: nodeSelection.endNode.start,
                endOffset: nodeSelection.endOffset
            }
            this.selections.push(vsel)
        })
    }
}

function getCurDOMSelection() {
    let selection = window.getSelection();
    let rangeList:Range[] = [];
    let vsels:VirtualSelection[] = []

    if (selection && selection.rangeCount > 0) {
        for (let i = 0; i < selection.rangeCount; i++) {
            rangeList.push(selection.getRangeAt(i));
        }
    }

    for (let i in rangeList) {
        const range: Range = rangeList[i]
        const { startContainer, endContainer, startOffset, endOffset } = range
        const vsel = _innerGetDOMSelection(startContainer, endContainer, startOffset, endOffset)
        if(vsel != null && vsel != undefined){
            vsels.push(vsel)
        }
    }

    return vsels
}

export function setDOMSelection(docView: AditorDocView, vsels: VirtualSelection[]) {
    let selection = window.getSelection();
    selection?.removeAllRanges();

    vsels.forEach(vsel => {
        const { start, end, startOffset, endOffset } = vsel;
        let startNode = getNodeByPos(docView.docState.root.virtualId, start);

        if (startNode?.childNodes && startNode.childNodes.length > 0 && startNode.childNodes[0].nodeType === 3) {
            startNode = startNode.childNodes[0]
        }
        let endNode = getNodeByPos(docView.docState.root.virtualId, end);
        if (endNode?.childNodes && endNode.childNodes.length > 0 && endNode.childNodes[0].nodeType === 3) {
            endNode = endNode.childNodes[0]
        }
        if(endNode && startNode){
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            selection?.addRange(range);
        }else{
            console.log("set Selection failed, because startNode or endNode is null")
        }
        
    });
}

function getNodeByPos(domId: string, pos: number){
    const parentDom = document.getElementById(domId)

    const domNode = parentDom?.querySelector('[aditorid="_aditor-' + pos + '"]')
    const childNode = domNode?.childNodes[0]
    if (childNode) {
        return childNode
    } else {
        return domNode
    }
}


function _innerGetDOMSelection(_startNode: Node, _endNode: Node, _startOffset: number, _endOffset: number): VirtualSelection| null {
    // Element node (nodeType=1): Represents an HTML element, such as <div>, <p>, <span>, and other tags.
    // Attribute node (nodeType=2): Represents an attribute of an element.
    // Comment node (nodeType=8): Represents an HTML comment <!-- comment -->.
    // Document node (nodeType=9): Represents the entire HTML document.
    // Document fragment node (nodeType=11): Represents a fragment of nodes.
    // Text node (nodeType=3): Represents text in an element (same as nodeValue for the element).

    const { start, offset: startOffset } = _innerGetSingleDOMSelection(_startNode, _startOffset)
    const { start: end, offset: endOffset } = _innerGetSingleDOMSelection(_endNode, _endOffset)
    if(start == null || end == null || startOffset == null || endOffset == null){
        console.warn(`start or end is null, start: ${start}, end: ${end}, startOffset: ${startOffset}, endOffset: ${endOffset}`)
        return null
    }
    const vsel:VirtualSelection = {
        start,
        startOffset,
        end,
        endOffset
    }
    return vsel
}

function _innerGetSingleDOMSelection(_domNode: Node, _offset:number) {
    const nodeType = _domNode.nodeType
    const parentNode: Node | Element | null | undefined = _domNode.parentNode

    let start: number | null = null
    let offset: number | null = null
    
    if(_domNode.nodeType === 3){ // Text node
        if(parentNode != null){
            const sel = getSelAndOffset(parentNode as Element, _offset)
            start = sel.start
            offset = sel.offset
        }else{
            console.error(`Text node ${_domNode} has no parentNode`)
        }
    }else if(_domNode.nodeType === 1){ // Element node
        const sel = getSelAndOffset(_domNode as Element, _offset)
        start = sel.start
        offset = sel.offset
    }else{
        console.error(`Unknown nodeType ${nodeType}, node details: ${_domNode}`)
    }
    return {start, offset}
    // // For Text nodes, we need to check if the parent node can be selected. If it doesn't have a validAditorId, return null.
    // if (nodeType === 3 && parentNode && validAditorId(parentId)) {
    //     // if domNode.textContent exists \u200B, offset should be reduced by 1
    //     if(domNode.textContent?.includes("\u200B")){
    //         offset = offset > 0 ? offset-1 : 0
    //     }
    //     return {id:parentId, offset}
    // } else if(nodeType === 3 && parentNode && validAditorId(parentHashId)){
    //     if(domNode.textContent?.includes("\u200B")){
    //         offset = offset > 0 ? offset-1 : 0
    //     }
    //     return {id:parentHashId, offset}
    // } else if(validAditorId(domId)){
    //     return getFixPos(domNode, domId, offset)
    // } else if(validAditorId(domHashId)){
    //     return getFixPos(domNode, domHashId, offset)
    // }else{
    //     return {id:null, offset:null}
    // }
}

function validAditorId(id: string | undefined | null){
    if(id == null || id == undefined){
        return false
    }else{
        if(id.startsWith("_aditor-")){
            return true
        }
    }
}

function getSelAndOffset(_domNode: Element, _offset:number){

    const parseId2Num = (_strId: string)=>{
        // _strId is in the form of `_aditor-${aNode.start}`, remove the preceding `_aditor`, get the variable content `${aNode.start}`, and convert it to an integer.
        const _start = parseInt(_strId.split("-")[1])
        // test if _start is not null and a number
        if(_start != null && _start != undefined){
            if(isNaN(_start)){
                console.error(`aditorId not valid: ${_strId}`)
                return null
            }else{
                return _start
            }
        }else{
            console.error(`aditorId not valid: ${_strId}`)
            return null
        }
    }

    // selStart first
    let start = null 
    let offset = null
    let _selOffsetCor = 0

    let _selStart = _domNode.getAttribute("selstart")
    // test if _selStart is a number
    if(_selStart != null && _selStart != undefined){
        if(isNaN(parseInt(_selStart))){
            _selStart = null
        }
    }

    if(_selStart){
        start = parseInt(_selStart)
    }else{ // only when _selStart is null, we try to get aditorId to calculate start
        let _aditorId = _domNode.getAttribute("aditorid")
        // test if _aditorId is not null 
        if(validAditorId(_aditorId)){
            start = parseId2Num(_aditorId!)
        }
    }

    //get offset
    // selOffset first
    _selOffsetCor = _domNode.getAttribute("seloffsetcor")
    // test if _selOffset is a number
    if(_selOffsetCor != null && _selOffsetCor != undefined){
        if(isNaN(parseInt(_selOffsetCor))){
            _selOffsetCor = 0
        }
    }
    // console.log(`_offset is : ${_offset}, _selOffsetCor is : ${_selOffsetCor}`)
    offset = _offset - _selOffsetCor
    offset = offset > 0 ? offset : 0

    return {start, offset}
}

export function collapseDOMSelection() {
    const selections = window.getSelection();

    if(selections == null || selections == undefined){
        return
    }
    selections.removeAllRanges();
}

function handlerSelectionchange(){
    if(getCurDOMSelection().length == 0){
        collapseDOMSelection()
    }
}

// let hasSelectionChangeListener = false 
// if(hasSelectionChangeListener === false){
//     document.addEventListener("selectionchange", handlerSelectionchange);
//     hasSelectionChangeListener = true
// }
