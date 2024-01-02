import { docStruct, aNodeFactory } from ".";
import {nanoid} from 'nanoid';

/**
 * generate random id
 * @returns 
 */
function uuid() {
    const padStart = (str: string, length: number, padChar: string)=>{
        while (str.length < length) {
            str = padChar + str;
        }
        return str;
    }
    const timestamp = Date.now().toString()
    const random = padStart(Math.floor(Math.random() * 100000).toString(), 5, "0")
    return timestamp + random
}

export type NodeSelectionType = {
    startNode: AditorChildNode | AditorLeafNode | null,
    startOffset: number,
    endNode: AditorChildNode | AditorLeafNode | null,
    endOffset: number,
}

export enum ANodeType {
    Child = "child",
    Leaf = "leaf",
}

export abstract class ANode {
    id: string;
    virtualId: string;
    name: string;
    type: string;
    start: number;
    end: number;
    style: { [key: string]: any };
    data: { [key: string]: any };

    constructor(name: string, style:{}, data:{}) {
        this.id = nanoid();
        this.virtualId = nanoid();
        this.name = name;
        this.start = 0;
        this.end = 0;
        this.style = style;
        this.data = data;
        this.type = ANodeType.Child;
    }

    abstract calPosition(prevEnd: number): void;
    abstract delete(_start:number, _end:number): void;
    abstract insertText(_text:string, _start:number): void;
    abstract merge(node: ANode): void;
    abstract split(_start:number, _end:number): void;
    abstract length(): number;
    abstract insertNode(_node: AditorChildNode|AditorLeafNode, _start:number): AditorChildNode | AditorLeafNode | null;
}

export class AditorChildNode extends ANode {
    children: (AditorChildNode | AditorLeafNode) [];

    constructor(name: string, style:{}, data:{}) {
        super(name, style, data);
        this.type=ANodeType.Child;
        this.children = [];
    }

    calPosition(prevEnd: number = 0) {
        this.start = prevEnd + 1;
        this.children.forEach((child, index) => {
            const prevChildEnd = index === 0 ? this.start : this.children[index - 1].end;
            child.calPosition(prevChildEnd);
        });
        if(this.children.length > 0)
            this.end = this.children[this.children.length - 1].end+1;
        else
            this.end = this.start+1;
    }
    addChild(child: AditorChildNode | AditorLeafNode) {
        this.children.push(child);
    }
    deleteChild(child: AditorChildNode | AditorLeafNode) {
        this.children = this.children.filter((c) => c.id !== child.id);
    }
    deleteChildById(id: string) {
        this.children = this.children.filter((c) => c.id !== id);
    }
    deleteChildByIndex(index: number) {
        this.children.splice(index, 1);
    }
    delete(_start:number, _end:number){
        // node has no intersection with selection
        if (this.start > _end || this.end < _start) {
            return 
        }else{
            // delete children by _start and _end and chlidren length <= 0
            this.children = this.children.filter(child => {
                // if child has full intersection with selection, and not include _start, delete it
                if(child.start > _end || child.end < _start){
                    return true
                }else if((_start >= child.start && _start <= child.end) || (_end >= child.start && _end <= child.end)){
                    return true
                }else{
                    return false
                }
            })
        }
        return true
    }
    insertText(_text:string, _start:number): AditorChildNode | AditorLeafNode | null{
        // if no children, insert text to this node
        if(this.children.length === 0){
            let leaf = aNodeFactory.createAditorNode("aditorText", {}, {text: _text}) as AditorLeafNode
            this.addChild(leaf)
            return leaf
        }else{
            // insert node at first child
            let firstChild = this.children[0]
            firstChild.insertText(_text, _start)
            return firstChild
        }

    }
    merge(node: AditorChildNode): void {
        if(node.name == node.name){
            this.children = this.children.concat(node.children)
            node.children = []
        }else{
            console.warn("can not merge node with different name")
        }
    }
    /**
     * split node by _start and _end
     * Todo: can't recursive split
     * @param _start 
     * @param _end 
     * @returns 
     */
    split(_start:number): AditorChildNode | null{
        // then split
        if(this.start > _start || this.end < _start)
            return null

        if(this.start === _start){
            const copyNode = aNodeFactory.createAditorNode(this.name, this.style, this.data) as AditorChildNode
            copyNode.children = this.children
            this.children = []
            return copyNode as AditorChildNode
        }else{
            // flag to indicate if split node
            let splitFlag = false
            const splitNodes:(AditorLeafNode | AditorChildNode)[] = []
            this.children = this.children.filter(item =>{
                const splitNode = item.split(_start)
                if(splitNode){
                    splitFlag = true
                    splitNodes.push(splitNode)
                    return true
                }else if(splitFlag){
                    splitNodes.push(item)
                    return false
                }else{
                    return true
                }
            })
            const splitNode = aNodeFactory.createAditorNode(this.name, this.style, this.data) as AditorChildNode
            splitNode.children = splitNodes
            return splitNode
        }
    }
    length(): number {
        const childLength = this.children.reduce((prev, cur) => prev + cur.length(), 0)
        return childLength + this.children.length
    }
    insertNode(_node: AditorChildNode | AditorLeafNode, _start:number): AditorChildNode | AditorLeafNode | null{
        // find _start node
        const index = this.children.findIndex((child, index) => {
            if(child.start <= _start && child.end >= _start){
                return true
            }else{
                return false
            }
        })
        if(this.name === 'aditorParagraph'){
            if(_node.name === 'aditorText' && index > -1){
                this.children.splice(index+1, 0, _node)
                return _node
            }
        }else if(this.name === 'aditor'){
            if(_node.name === 'aditorParagraph' && index > -1){
                this.children.splice(index+1, 0, _node)
                return _node
            }
        }
        return null
    }
}

export class AditorLeafNode extends ANode {
    constructor(name:string, style:{}, data:{}) {
        super(name, style, data);
        this.type=ANodeType.Leaf;
    }

    calPosition(prevEnd: number = 0) {
        this.start = prevEnd + 1;
        this.end = this.start + this.data.text.length + 1;
    }
    delete(_start:number, _end:number){
        // delete this.data.text by _start and _end
        // first calculate offset
        let offset = _start - this.start
        let offsetEnd = _end - this.start

        if(offset < 0){
            offset = 0
        }
        if(offsetEnd > this.data.text.length){
            offsetEnd = this.data.text.length
        }
        // then delete
        this.data.text = this.data.text.slice(0, offset) + this.data.text.slice(offsetEnd)
        
    }
    insertText(_text: string, _start: number): AditorChildNode | AditorLeafNode | null {
        // insert text by _start
        // first calculate offset
        let offset = _start - this.start
        if(offset < 0){
            offset = 0
        }
        // then insert
        this.data.text = this.data.text.slice(0, offset) + _text + this.data.text.slice(offset)
        return this
    }
    insertNode(){
        return null
    }
    merge(node: ANode): void {
        return 
    }
    split(_start:number): AditorLeafNode | null{
        if(_start < this.start || _start > this.end)
            return null

        // split this.data.text by offset and end
        // first calculate offset
        const _end = this.start + this.length()
        let offsetStart = _start - this.start
        let offsetEnd = _end - this.start
        if(offsetStart < 0){
            offsetStart = 0
        }
        if(offsetEnd > this.data.text.length){
            offsetEnd = this.data.text.length
        }
        // then split
        let text = this.data.text.slice(offsetStart, offsetEnd)
        this.data.text = this.data.text.slice(0, offsetStart) + this.data.text.slice(offsetEnd)

        return aNodeFactory.createAditorNode(this.name, this.style, {text}) as AditorLeafNode
    }
    length(): number {
        return this.data.text.length
    }
}

export class AditorNodeFactory {
    private nodeTypes: Map<string, new (name: string, style: {}, data: {}) => AditorChildNode | AditorLeafNode> = new Map();

    public registerNode(name: string, nodeClass: new (name: string, style: {}, data: {}) => AditorChildNode | AditorLeafNode) {
        this.nodeTypes.set(name, nodeClass);
    }

    public createAditorNode(name: string, style: {}, data: {}): AditorChildNode | AditorLeafNode {
        const NodeClass = this.nodeTypes.get(name);
        if (!NodeClass) {
            throw new Error(`Invalid name: ${name}`);
        }
        return new NodeClass(name, style, data);
    }
}