import { aNodeFactory } from ".";
import {nanoid} from 'nanoid';

export enum StyleNameEnum {
    fontWeight = "font-weight",
    fontStyle = "font-style",
    textDecoration = "text-decoration",
    color = "color",
    backgroundColor = "background-color",
    textAlign = "text-align",
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
    // init with all StyleNameEnum
    validStyleList: StyleNameEnum[] = Object.values(StyleNameEnum);

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
    /**The selfMerge method is a method used by Child nodes to merge all child nodes below themselves
     * and different nodes require different SelfMerge implementations
     * the difference between merge and selfMerge is that merge is used to merge two specific nodes
     * and selfMerge is used to merge all child nodes below the node,and it's recursive
     * @param _start
     * @param _end
     * @param vsels notice:vsels will be modified by selfMerge
     * @returns
    */
    abstract selfMerge(_start:number, _end:number, vsels: NodeSelectionType[]): void;
    abstract split(_start:number, _end:number): void;
    abstract length(): number;
    abstract insertNode(_node: AditorChildNode|AditorLeafNode, _start:number): AditorChildNode | AditorLeafNode | null;

    abstract validStyle(): { [key: string]: string } | {};

    /**
     * _isEmpty is a method used to check if the node is empty
     */
    abstract _isEmpty(): boolean;
    /**
     * dfsDeepestRightEnd is a method used to find the deepest right end of the node
     * @returns number
     * @description
    */
    abstract _dfsDeepestRightEnd(): number;
    abstract _dfsDeepestRightEndNode(): AditorChildNode | AditorLeafNode;
    abstract _dfsDeepestLeftStart(): number;
    abstract _dfsDeepestLeftStartNode(): AditorChildNode | AditorLeafNode;
}

export class AditorChildNode extends ANode {
    children: (AditorChildNode | AditorLeafNode) [];

    constructor(name: string, style:{}, data:{}) {
        super(name, style, data);
        this.type=ANodeType.Child;
        this.children = [];
        this.validStyleList = [
            StyleNameEnum.textAlign
        ];
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
            this.children = this.children.filter(child => {
                // BUG: _start and _end is fixed, but child.length() will changed while delete child in loop
                // if del's selection total include child, delete child 
                // not use child.end because child.end include child self, suppose deepest child is a leaf node, real selection end will be child.end-1
                if(child.start > _start && child._dfsDeepestRightEnd()-1 <= _end){
                    return false
                }
                return true
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
    selfMerge(_start: number, _end:number, vsels:NodeSelectionType[]){
        if(_start > this.end || _end < this.start){
            return
        }
        for(let i=0; i<this.children.length-1; i++){
            this.children[i].selfMerge(_start, _end, vsels)
        }
    }
    /**
     * split node by _start and _end
     * There is four spcial case:
     * 1. split node is empty
     * 2. after splited, front node is empty
     * 3. after splited, back node is empty
     * 4. after splited, front node and back node is empty
     * @param _start 
     * @param _end 
     * @returns 
     */
    split(_start:number): AditorChildNode | null{
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
                // when find split node, set flag to true, and push all nodes after split node to splitNodes
                if(splitNode && splitFlag == false){
                    splitFlag = true
                    splitNodes.push(splitNode)
                    return true
                }else if(splitFlag){
                    splitNodes.push(item)
                    return false
                }
                return true
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
    validStyle(): { [key: string]: string } | {} {
        const validStyle: { [key: string]: string } = {};
        for (const styleName of this.validStyleList) {
            if (this.style[styleName]) {
                validStyle[styleName] = this.style[styleName];
            }
        }
        return Object.keys(validStyle).length > 0 ? validStyle : {};
    }
    /**
     * recursive call _isEmpty to check if node is empty
     */
    _isEmpty(): boolean{
        for(let i=0; i<this.children.length; i++){
            if(!this.children[i]._isEmpty()){
                return false
            }
        }
        return true
    }
    _dfsDeepestRightEnd(): number {
        if(this.children.length === 0){
            return this.end
        }else{
            return this.children[this.children.length-1]._dfsDeepestRightEnd()
        }
    }
    _dfsDeepestRightEndNode(): AditorChildNode | AditorLeafNode {
        if(this.children.length === 0){
            return this
        }else{
            return this.children[this.children.length-1]._dfsDeepestRightEndNode()
        }
    }

    _dfsDeepestLeftStart(): number {
        if(this.children.length === 0){
            return this.start
        }else{
            return this.children[0]._dfsDeepestLeftStart()
        }
    }

    _dfsDeepestLeftStartNode(): AditorChildNode | AditorLeafNode {
        if(this.children.length === 0){
            return this
        }else{
            return this.children[0]._dfsDeepestLeftStartNode()
        }
    }
}

export class AditorLeafNode extends ANode {
    constructor(name:string, style:{}, data:{}) {
        super(name, style, data);
        this.type=ANodeType.Leaf;
        this.validStyleList = [
            StyleNameEnum.fontWeight
            , StyleNameEnum.fontStyle
            , StyleNameEnum.textDecoration
            , StyleNameEnum.color
            , StyleNameEnum.backgroundColor
        ];
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
    selfMerge(_start: number, _end: number, vsels: NodeSelectionType[]): void {
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
    validStyle(): { [key: string]: string } | {} {
        const validStyle: { [key: string]: string } = {};
        for (const styleName of this.validStyleList) {
            if (this.style[styleName]) {
                validStyle[styleName] = this.style[styleName];
            }
        }
        return Object.keys(validStyle).length > 0 ? validStyle : {};
    }
    _isEmpty(): boolean {
        return this.data.text.length === 0
    }
    _dfsDeepestRightEnd(): number {
        return this.end
    }
    _dfsDeepestRightEndNode(): AditorChildNode | AditorLeafNode {
        return this
    }
    _dfsDeepestLeftStart(): number {
        return this.start
    }
    _dfsDeepestLeftStartNode(): AditorChildNode | AditorLeafNode {
        return this
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