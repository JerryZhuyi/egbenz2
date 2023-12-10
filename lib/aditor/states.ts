/**
 * This file is responsible for storing the virtual tree structure of each aditor file.
 */
import { reactive, VNode } from 'vue'
import { AditorChildNode, AditorLeafNode, ANodeType} from './nodes'
import type {AditorDocView} from './views'
import {VirtualSelections} from "./selection";

/**
 * Represents the structure of a document.
 */
interface docStruct{
    name: string,
    type: ANodeType,
    style: {},
    data: {
        text?: string,
    },
    children: docStruct[]
}

/**
 * Loads a JSON object into an AditorChildNode.
 * @param json - The JSON object representing the document structure.
 * @param state - The AditorDocState object.
 * @returns The loaded AditorChildNode.
 */
export function loadJSON2ANode(json: docStruct, state: AditorDocState): AditorChildNode{
    const _loadJSON2ANode = (json: docStruct)=>{
        if(json.type == ANodeType.Child){
            const anode = new AditorChildNode(json.name, json.style, json.data, state)
            anode.children = json.children.map(child => _loadJSON2ANode(child))
            return anode
        }else{
            const anode = new AditorLeafNode(json.name, json.style, json.data, state)
            return anode
        }
    }
    const anode = _loadJSON2ANode(json)
    anode.calPosition(-1)
    return (anode as AditorChildNode)
}

/**
 * Represents the state of an Aditor document.
 */
export class AditorDocState{
    root!: AditorChildNode;
    vnode!: VNode;
    docView!: AditorDocView;
    sels: VirtualSelections = new VirtualSelections();

    constructor(){
        
    }

    /**
     * Initializes the AditorDocState with the specified parameters.
     * @param anode - The root AditorChildNode.
     * @param vnode - The VNode representing the document view.
     * @param docView - The AditorDocView object.
     */
    init(anode: AditorChildNode, vnode: VNode, docView: AditorDocView){
        this.root = anode
        this.vnode = vnode
        this.docView = docView
    }

    /**
     * Loads a JSON object into the document structure.
     * @param json - The JSON object representing the document structure.
     */
    loadJSON(json: docStruct){
        this.root = reactive((loadJSON2ANode(json, this) as AditorChildNode))
    }

    /**
     * Converts the document structure to a JSON object.
     * @returns The JSON object representing the document structure.
     */
    toJSON(){
        return JSON.parse(JSON.stringify(this.root))
    }
}

