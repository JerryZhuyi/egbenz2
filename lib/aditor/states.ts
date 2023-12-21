/**
 * This file is responsible for storing the virtual tree structure of each aditor file.
 */
import { reactive, toRaw } from 'vue'
import { AditorChildNode, AditorLeafNode, ANodeType, NodeSelectionType } from './nodes'
import {VirtualSelections, VirtualSelection} from "./selection";

/**
 * Represents the structure of a document.
 */
export interface docStruct{
    name: string,
    type: ANodeType,
    style: {},
    data: {
        text?: string,
    },
    children: docStruct[]
}

/**
 * Represents the state of an Aditor document.
 */
export class AditorDocState{
    root!: AditorChildNode;
    sels: VirtualSelections = new VirtualSelections();

    constructor(){
    }

    /**
     * Initializes the AditorDocState with the specified parameters.
     * @param sels - VirtualSelections
     */
    loadSels(sels: VirtualSelections){
        this.sels = sels
    }

    /**
     * Loads a JSON object into an AditorChildNode.
     * @param json - The JSON object representing the document structure.
     */
    loadJSON2ANode(json: docStruct) {
        const _loadJSON2ANode = (json: docStruct) => {
            if (json.type == ANodeType.Child) {
                const aNode = new AditorChildNode(json.name, json.style, json.data)
                aNode.children = json.children.map(child => _loadJSON2ANode(child))
                return aNode
            } else {
                const aNode = new AditorLeafNode(json.name, json.style, json.data)
                return aNode
            }
        }
        const aNode = _loadJSON2ANode(json)
        aNode.calPosition(-1)
        this.root = reactive((aNode as AditorChildNode))
    }

    /**
     * Converts the document structure to a JSON object.
     * @returns The JSON object representing the document structure.
     */
    toJSON(){
        const stateJson = {
            root: JSON.parse(JSON.stringify(this.root)),
            sels: JSON.parse(JSON.stringify(this.sels))
        }
        return stateJson
    }

    copySelf(){
        const state = new AditorDocState()
        const copyState = this.toJSON()
        state.loadJSON2ANode(copyState.root)
        state.root = toRaw(state.root)
        state.loadSels(copyState.sels)
        return state
    }

    copySels(vsels: VirtualSelection[]){
        const nodeSels:NodeSelectionType[] = []
        for(let vsel of vsels){
            const { start, end } = vsel
            const startNode = this.findNodeByPos(start)
            const endNode = this.findNodeByPos(end)
            if(startNode != null && endNode != null){
                nodeSels.push({
                    startNode: startNode,
                    startOffset: vsel.startOffset,
                    endNode: endNode,
                    endOffset: vsel.endOffset,
                })
            }else{
                console.warn("[copySels]startNode or endNode is null")
            }
        }
        return nodeSels
    }

    deleteNodeByPos(start: number, end: number){
        const _deleteNodeByPos = (aNode: AditorChildNode | AditorLeafNode, start: number, end: number): void=>{
            // If aNode has no intersection with start and end
            if (aNode.start > end || aNode.end < start) {
                return 
            }else{
                if(aNode instanceof AditorChildNode){
                    aNode.children.forEach(child => _deleteNodeByPos(child, start, end))
                }
                aNode.delete(start, end)
                return 
            }
            
        }
        return _deleteNodeByPos(this.root, start, end)
    }

    insertTextByPos(text: string, start:number): AditorChildNode | AditorLeafNode | null{
        const insertNode = this.findNodeByPos(start)
        console.log("at ", insertNode?.start, " insert text")
        if(insertNode != null){
            return insertNode.insertText(text, start)
        }
        return null
    }
    // merge two node
    mergeNode(nodeA: AditorChildNode | AditorLeafNode, nodeB: AditorChildNode | AditorLeafNode): void{
        if(nodeA instanceof AditorLeafNode && nodeB instanceof AditorLeafNode){
            console.log("merge two leaf node")
        }else if(nodeA instanceof AditorChildNode && nodeB instanceof AditorChildNode){
            console.log("merge two child node")

        }else if(nodeA instanceof AditorChildNode && nodeB instanceof AditorLeafNode){
            console.log("merge child node and leaf node")
        }
    }

    findNodeByPos(start:number){
        const _findNodeByPos = (aNode: AditorChildNode | AditorLeafNode, start: number): AditorChildNode | AditorLeafNode | null=>{
            if(aNode.start == start || aNode.end == start){
                return aNode
            }else if (aNode instanceof AditorLeafNode){

                if(start >= aNode.start && start <= aNode.end){
                    return aNode
                }else{
                    return null
                }
            }else if(aNode instanceof AditorChildNode){
                if(aNode.start > start || aNode.end < start){
                    return null
                }
                for(let i in aNode.children){
                    const child = aNode.children[i]
                    const res = _findNodeByPos(child, start)
                    if(res != null){
                        return res
                    }
                }
                return null
            }else{
                return null
            }
        }
        return _findNodeByPos(this.root, start)

    }

    findLastNodeByNode(node: AditorChildNode | AditorLeafNode){
        const _findLastNodeByNode = (aNode: AditorChildNode | AditorLeafNode): AditorChildNode | AditorLeafNode=>{
            if(aNode instanceof AditorChildNode){
                if(aNode.children.length == 0){
                    return aNode
                }
                const lastChild = aNode.children[aNode.children.length-1]
                return _findLastNodeByNode(lastChild)
            }else{
                return aNode
            }
        }
        return _findLastNodeByNode(node)
    }

    findNodeParentNodeByPos(start:number): AditorChildNode | null{
        let parentNode: null | AditorChildNode = null
        let findDirectNode = false
        const _findNodeParentNodeByPos = (aNode: AditorChildNode | AditorLeafNode, start: number): void =>{
            if(aNode instanceof AditorLeafNode){
                if(start >= aNode.start && start <= aNode.end){
                    findDirectNode = true
                }
            }else if(aNode instanceof AditorChildNode){
                for(let i in aNode.children){
                    const child = aNode.children[i]
                    _findNodeParentNodeByPos(child, start)
                }
                if(findDirectNode && parentNode == null){
                    parentNode = aNode
                }else if(start >= aNode.start && start <= aNode.end){
                    findDirectNode = true
                }
            }            
        }
        _findNodeParentNodeByPos(this.root, start)
        return parentNode
    }

    /** 
     * Find the deepest common node of two nodes（LCA: longest common ancestor）
     * @param _nodeA - The first node
     * @param _nodeB - The second node
     * @returns The deepest common node of the two nodes
    */
    dfsFindLCANode(_nodeA:AditorChildNode | AditorLeafNode, _nodeB:AditorChildNode | AditorLeafNode){
        if(_nodeA == null || _nodeB == null){
            console.warn("nodeA or nodeB is null")
            return null
        }
        const pathA:(AditorChildNode | AditorLeafNode)[] = []
        const pathB:(AditorChildNode | AditorLeafNode)[] = []
        const _dfsFindLCANode = (_rootNode: AditorChildNode | AditorLeafNode, _targetNode:AditorChildNode | AditorLeafNode, _path:(AditorChildNode | AditorLeafNode)[])=>{
            _path.push(_rootNode)
            if(_targetNode.start == _rootNode.start){
                _path.push(_rootNode)
                return true
            }else if(_rootNode instanceof AditorChildNode){
                for(let i in _rootNode.children){
                    const child = _rootNode.children[i]
                    if(_targetNode.start >= child.start && _targetNode.start <= child.end){
                        const result = _dfsFindLCANode(child, _targetNode, _path)
                        if(result){
                            return true
                        }
                    }
                }
                _path.pop()
                return false
            }else{
                _path.pop()
                return false
            }
        }
        _dfsFindLCANode(this.root, _nodeA, pathA)
        _dfsFindLCANode(this.root, _nodeB, pathB)
        
        //compare two path deepest common node
        let i = 0
        while(i < pathA.length && i < pathB.length){
            if(pathA[i].start == pathB[i].start){
                i++
            }else{
                break
            }
        }

        if(i>0){
            return [pathA[i-1], pathA[i], pathB[i]]
        }else{
            return null
        }
    }

    deleteEmptyNode(start: number, end:number, staySels: NodeSelectionType[]){
        const _deleteEmptyNode = (aNode: AditorChildNode | AditorLeafNode, start: number, end: number, staySels: NodeSelectionType[]): boolean=>{
            // 如果anode的位置和传入的start和end有交集
            if (aNode.start > end || aNode.end < start) {
                return false
            }else{
                if(aNode instanceof AditorChildNode){
                    aNode.children.forEach(child => _deleteEmptyNode(child, start, end, staySels))
                }
                if(aNode instanceof AditorLeafNode){
                    if(aNode.data.text == ""){
                        aNode.delete(start, end)
                        return true
                    }
                }
                return false
            }
            
        }
        return _deleteEmptyNode(this.root, start, end, staySels)
    }

}

