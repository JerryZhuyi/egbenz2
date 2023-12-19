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
    const random = padStart(Math.floor(Math.random() * 1000).toString(), 3, "0")
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
        this.id = uuid();
        this.virtualId = uuid();
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
    abstract length(): number;
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
        if(this.start > _start || this.end < _end){
            // delete children by _start and _end and chlidren length <= 0
            this.children = this.children.filter(child => {
                if(child.start > _end || child.end < _start || child.length() > 0){
                    return true
                }
            })
        }
        return true
    }
    insertText(_text:string, _start:number): AditorChildNode | AditorLeafNode | null{
        // 判断是否有child,没有就增加一个leaf
        if(this.children.length === 0){
            let leaf = new AditorLeafNode("aditorText", {}, {text: _text})
            this.addChild(leaf)
            return leaf
        }else{
            // 在第一个子节点增加文本
            let firstChild = this.children[0]
            firstChild.insertText(_text, _start)
            return firstChild
        }

    }
    length(): number {
        return this.end-this.start
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
    length(): number {
        return this.data.text.length
    }
}
