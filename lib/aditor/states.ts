/**
 * 这个文件的主要作用是保存每一个aditor文件的虚拟树结构
 */
import { VNode } from 'vue'
import { AditorChildNode, AditorLeafNode, ANodeType} from './nodes'


interface docStruct{
    name: string,
    type: ANodeType,
    style: {},
    data: {
        text?: string,
    },
    children: docStruct[]
}


export function loadJSON2ANode(json: docStruct){
    const _loadJSON2ANode = (json: docStruct)=>{
        if(json.type == "child"){
            const anode = new AditorChildNode(json.name, json.style, json.data)
            anode.children = json.children.map(child => _loadJSON2ANode(child))
            return anode
        }else{
            const anode = new AditorLeafNode(json.name, json.style, json.data)
            return anode
        }
    }
    const anode = _loadJSON2ANode(json)
    anode.calPosition(-1)
    return anode
}

export class AditorDocState{
    root: AditorChildNode;
    vnode: VNode;
    constructor(anode: AditorChildNode, vnode: VNode){
        this.root = anode
        this.vnode = vnode
    }
    loadJSON(json: docStruct){
        this.root = (loadJSON2ANode(json) as AditorChildNode)
    }
    toJSON(){
        return JSON.parse(JSON.stringify(this.root))
    }
}

