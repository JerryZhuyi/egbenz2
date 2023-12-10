interface virtualSelectionInterface{
    startDomId: string|undefined|null
    endDomId: string|undefined|null
    startOffset: number
    endOffset: number
}

export class VirtualSelections{
    selections: virtualSelectionInterface[] = []
    lastSelections: virtualSelectionInterface[] = []
    constructor(){}
    updateSelections(){
        this.lastSelections = this.selections
        this.selections = getCurDOMSelection()
    }
}

function getCurDOMSelection() {
    let selection = window.getSelection();
    let rangeList:Range[] = [];
    let vsels:virtualSelectionInterface[] = []

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

function _innerGetDOMSelection(_startNode: Node, _endNode: Node, _startOffset: number, _endOffset: number): virtualSelectionInterface| null {
    // 元素节点（nodeType=1）：表示HTML元素，例如<div>、<p>、<span>等标签；
    // 元素节点（nodeType=2）：属性节点
    // 注释节点（nodeType=8）：表示HTML中的注释<!-- comment -->；
    // 文档节点（nodeType=9）：表示整个HTML文档；
    // 文档片段节点（nodeType=11）：表示由多个节点组成的片段。
    const { id:startDomId, offset: startOffset } = _innerGetSingleDOMSelection(_startNode, _startOffset)
    const { id:endDomId,  offset: endOffset } = _innerGetSingleDOMSelection(_endNode, _endOffset)
    if(startDomId == null || endDomId == null || startDomId == undefined || endDomId == undefined){
        return null
    }
    const vsel:virtualSelectionInterface = {
        startDomId,
        endDomId,
        startOffset,
        endOffset
    }
    return vsel
}

function _innerGetSingleDOMSelection(domNode: Node, offset:number) {
    const nodeType = domNode.nodeType
    const parentNode: Node | Element | null | undefined = domNode.parentNode

    let domId:string | undefined | null = null;
    try{
        domId = (domNode as Element)?.getAttribute("id");
    }catch{
        // Handle the error here if needed
    }
    
    const parentId:string | undefined | null = (parentNode as Element)?.getAttribute("id")

    // For Text nodes, we need to check if the parent node can be selected. If it doesn't have a validAditorId, return null.
    if (nodeType === 3 && parentNode && validAditorId(parentId)) {
        return {id:parentId, offset}
    } else if(validAditorId(domId)){
        return {id:domId, offset}
    } else{
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