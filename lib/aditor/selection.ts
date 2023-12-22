import { AditorDocView } from "./views"

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

    const domNode = parentDom?.querySelector('[pos="_aditor-' + pos + '"]')
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

    const parseId2Num = (_strId: string)=>{
        // _strId is in the form of `_aditor-${aNode.start}`, remove the preceding `_aditor`, get the variable content `${aNode.start}`, and convert it to an integer.
        return parseInt(_strId.split("-")[1]);
    }

    const { id:startDomId, offset: startOffset } = _innerGetSingleDOMSelection(_startNode, _startOffset)
    const { id:endDomId,  offset: endOffset } = _innerGetSingleDOMSelection(_endNode, _endOffset)
    if(startDomId == null || endDomId == null || startDomId == undefined || endDomId == undefined){
        return null
    }
    const vsel:VirtualSelection = {
        start: parseId2Num(startDomId),
        startOffset,
        end: parseId2Num(endDomId),
        endOffset
    }
    return vsel
}

function _innerGetSingleDOMSelection(domNode: Node, offset:number) {
    const nodeType = domNode.nodeType
    const parentNode: Node | Element | null | undefined = domNode.parentNode

    let domId:string | undefined | null = null;
    let domHashId: string | undefined | null = null;
    let parentId:string | undefined | null = null;
    let parentHashId: string | undefined | null = null;

    try{
        domId = (domNode as Element)?.getAttribute("pos");
    }catch{
        // Handle the error here if needed
    }
    try{
        domHashId = (domNode as Element)?.getAttribute("hash_pos");
    }catch{
        // Handle the error here if needed
    }
    try{
        parentId = (parentNode as Element)?.getAttribute("pos");
    }catch{
        // Handle the error here if needed
    }
    try{
        parentHashId = (parentNode as Element)?.getAttribute("hash_pos");
    }catch{
        // Handle the error here if needed
    }
    
    // For Text nodes, we need to check if the parent node can be selected. If it doesn't have a validAditorId, return null.
    if (nodeType === 3 && parentNode && validAditorId(parentId)) {
        // if domNode.textContent exists \u200B, offset should be reduced by 1
        if(domNode.textContent?.includes("\u200B")){
            offset = offset > 0 ? offset-1 : 0
        }
        return {id:parentId, offset}
    } else if(nodeType === 3 && parentNode && validAditorId(parentHashId)){
        if(domNode.textContent?.includes("\u200B")){
            offset = offset > 0 ? offset-1 : 0
        }
        return {id:parentHashId, offset}
    } else if(validAditorId(domId)){
        
        return getFixPos(domNode, domId, offset)
    } else if(validAditorId(domHashId)){
        return getFixPos(domNode, domHashId, offset)
    }else{
        return {id:null, offset:null}
    }
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

function getFixPos(domNode: Node, domId:string | null, offset:number){
    const childNode = domNode.childNodes[offset]
    if(childNode && childNode.nodeType === 3){
        return {id: domId, offset}
    }else if(childNode && childNode.nodeType === 1){
        const fixOffset = (childNode as Element).getAttribute("offset")
        if(fixOffset != null && fixOffset != undefined){
            return {id: domId, offset: parseInt(fixOffset)}
        }else{
            return {id: null, offset:null}
        }
    }else{
        return {id: null, offset: null}
    }
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
