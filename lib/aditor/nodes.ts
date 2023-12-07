/**
 * 用于生成随机ID
 * @returns 
 */
function uuid() {
    const timestamp = Date.now().toString()
    const random = this.padStart(Math.floor(Math.random() * 1000).toString(), 3, "0")
    return timestamp + random
}

export abstract class _Node {
    id: string;
    virtualId: string;
    name: string;
    start: number;
    end: number;
    style: { [key: string]: any };
    data: { [key: string]: any };

    constructor(start: number, name: string) {
        this.id = uuid();
        this.virtualId = uuid();
        this.name = name;
        this.start = start;
        this.end = start;
        this.style = {};
        this.data = {};
    }

    abstract calculateEnd(): void;
}

export class AditorChildNode extends _Node {
    children: _Node[];

    constructor(start: number, name: string, children: _Node[]) {
        super(start, name);
        this.children = children;
        this.calculateEnd();
    }

    calculateEnd() {
        this.end = this.children.reduce((acc, child) => acc + child.end, this.start);
    }
}

export class AditorLeafNode extends _Node {
    length: number;

    constructor(start: number, name: string, length: number) {
        super(start, name);
        this.length = length;
        this.calculateEnd();
    }

    calculateEnd() {
        this.end = this.start + this.length;
    }
}
