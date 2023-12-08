/**
 * 用于生成随机ID
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
        this.end = this.children[this.children.length - 1].end+1;
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
        this.end = this.start + this.data.text.length;
    }
    length(): number {
        return this.end-this.start
    }
}
