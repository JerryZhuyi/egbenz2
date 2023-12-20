/**
 * This file is responsible for storing the virtual tree structure of each aditor file.
 */
import { reactive } from 'vue'
import { AditorChildNode, AditorLeafNode, ANodeType, NodeSelectionType } from './nodes'
import {VirtualSelections} from "./selection";

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
        state.loadSels(copyState.sels)
        return state
    }

    deleteNodeByPos(start: number, end: number){
        const _deleteNodeByPos = (aNode: AditorChildNode | AditorLeafNode, start: number, end: number): boolean=>{
            // If aNode has no intersection with start and end
            if (aNode.start > end || aNode.end < start) {
                return false
            }else{
                if(aNode instanceof AditorChildNode){
                    aNode.children.forEach(child => _deleteNodeByPos(child, start, end))
                }
                aNode.delete(start, end)
                // If node is aditorChildNode, and it is empty, and it is not the start node
                if(aNode instanceof AditorChildNode){
                    const parentNode = this.findNodeParentNodeByPos(aNode.start) as AditorChildNode
                    if(parentNode
                        && aNode.length() == 0 
                        && aNode.start != start
                    ){
                        parentNode.children = parentNode.children.filter(child => child.start != aNode.start)
                    }
                }
                return true
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

