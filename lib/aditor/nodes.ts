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
    }

    abstract calPosition(): void;
}

export class AditorChildNode extends ANode {
    children: (AditorChildNode | AditorLeafNode) [];

    constructor(name: string, style:{}, data:{}) {
        super(name, style, data);
        this.type=ANodeType.child;
        this.children = [];
    }

    calPosition() {
        this.end = this.children.reduce((acc, child) => acc + child.end, this.start);
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
}

export class AditorLeafNode extends ANode {

    constructor(name:string, style:{}, data:{}) {
        super(name, style, data);
        this.type=ANodeType.leaf;
    }

    calPosition() {
        this.end = this.start + this.data.text.length;
    }
}
