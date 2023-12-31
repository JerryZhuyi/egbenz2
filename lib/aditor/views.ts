import type { AditorDocState } from "./states";
import { loadJSON2ANode, loadText2Node } from "./states";
import { collapseDOMSelection, setDOMSelection, VirtualSelection } from "./selection";
import { VNode, nextTick } from 'vue'
import { AditorChildNode, AditorLeafNode, NodeSelectionType } from "./nodes";
import { str2AditorDocJson } from "./renderer";

type SysInputEventsHandlerKey = keyof SysEventsHandler;

type SysEventsHandler = {
    keydown?: (event: KeyboardEvent, docState: AditorDocState, docView: AditorDocView) => void;
    keyup?: (event: KeyboardEvent, docState: AditorDocState, docView: AditorDocView) => void;
    keypress?: (event: KeyboardEvent, docState: AditorDocState, docView: AditorDocView) => void;
    click?: (event: MouseEvent, docState: AditorDocState, docView: AditorDocView) => void;
    mousedown?: (event: MouseEvent, docState: AditorDocState, docView: AditorDocView) => void;
    mouseleave?: (event: MouseEvent, docState: AditorDocState, docView: AditorDocView) => void;
    mouseup?: (event: MouseEvent, docState: AditorDocState, docView: AditorDocView) => void;
    blur?: (event: FocusEvent, docState: AditorDocState, docView: AditorDocView) => void;
    mouseover?: (event: MouseEvent, docState: AditorDocState, docView: AditorDocView) => void;
    mousewheel?: (event: WheelEvent, docState: AditorDocState, docView: AditorDocView) => void;
    compositionstart?: (event: CompositionEvent, docState: AditorDocState, docView: AditorDocView) => void;
    compositionend?: (event: CompositionEvent, docState: AditorDocState, docView: AditorDocView) => void;
    input?: (event: InputEvent, docState: AditorDocState, docView: AditorDocView) => void;
    drag?: (event: DragEvent, docState: AditorDocState, docView: AditorDocView) => void;
    dragsart?: (event: DragEvent, docState: AditorDocState, docView: AditorDocView) => void;
    drop?: (event: DragEvent, docState: AditorDocState, docView: AditorDocView) => void;
}

export enum SysEventsEnum {
    keydown = 'keydown',
    keyup = 'keyup',
    keypress = 'keypress',
    click = 'click',
    mousedown = 'mousedown',
    mouseleave = 'mouseleave',
    mouseup = 'mouseup',
    blur = 'blur',
    mouseover = 'mouseover',
    mousewheel = 'mousewheel',
    compositionstart = 'compositionstart',
    compositionend = 'compositionend',
    input = 'input',
    drag = 'drag',
    dragsart = 'dragsart',
    drop = 'drop',
}

enum ViewEventEnum {
    DELETE_SELECTIONS = 'deleteSelections',
    INSERT_SELECTIONS = 'insertSelections',
    REPLCAE_SELECTIONS = 'replaceSelections',
    BACKSPACE_SELECTIONS = 'backspaceSelections',
    ENTER_SELECTIONS = 'enterSelections',
    INSERT_NODES_SELECTIONS = 'insertNodesSelections',
}

function genSysInputEventHandlers(): SysEventsHandler {
    let sysEventHandlers: SysEventsHandler = {};
    for (let key in SysEventsEnum) {
        sysEventHandlers[key as SysInputEventsHandlerKey] = () => { };
    }
    return sysEventHandlers;
}

/**
 * @description: The view of the document. non global events management. only manage the events of the document.
 */
export class AditorDocView {
    docState!: AditorDocState;
    vNode!: VNode;

    // Each advisor will have a doc event handler with its own scope
    // Generally, after the root node component is mounted, binding related events are called by default
    docSysEventHandlers: SysEventsHandler = genDefaultSysInputEventHandlers();
    boundDocSysEvents: Map<string, { element: HTMLElement, handler: (e: Event) => void }> = new Map();
    docSysEventHookBefore: Map<SysEventsEnum, ((e: Event, state: AditorDocState, view: AditorDocView) => void)[] > = genDefaultSysInputEventHook();

    // For some extended or customized components
    // if you want to fully write your own event listening, you can use this method
    sysEventHandlers: SysEventsHandler = genSysInputEventHandlers();
    boundSysEvents: Map<string, { element: HTMLElement, handler: (e: Event) => void }[]> = new Map();

    globalSysEventsHandlers: SysEventsHandler = genGlobalSysInputEventHandlers();
    boundGlobalSysEvents: Map<string, (e: Event) => void> = new Map();

    isComposing: boolean = false;
    composingTimeout: number = -1;

    constructor() {
    }

    init(docState: AditorDocState, vNode: VNode) {
        this.docState = docState
        this.vNode = vNode
    }

    bindGlobalSysEvent(rootElement: HTMLElement) {
        for (const [name, handlers] of Object.entries(this.globalSysEventsHandlers)) {
            const boundHandler = (e: any) => {
                // Only Excute the handlers when the event target is not in the rootElement.
                if (!rootElement.contains(e.target as Node))
                    handlers(e, this.docState, this)
            };

            if (name === 'mousewheel')
                window.addEventListener('mousewheel', boundHandler, { passive: true });
            else
                window.addEventListener(name, boundHandler);

            this.boundGlobalSysEvents.set(name, boundHandler);
        }
    }

    /**
     * Binds the document system input event to the specified element.
     * 
     * @param element - The HTML element to bind the event to.
     * @param callfuncs - An object containing callback functions for each system input event.
     */
    bindDocSysEvent(element: HTMLElement) {
        for (const name of Object.values(SysEventsEnum)) {
            if (name in this.docSysEventHandlers) {
                const boundHandler = (e: any) => this.docSysEventHandlers[name]!(e as any, this.docState, this);
                if (name === 'mousewheel')
                    element.addEventListener('mousewheel', boundHandler, { passive: true });
                else
                    element.addEventListener(name, boundHandler);
                if (!this.boundDocSysEvents.has(name)) {
                    this.boundDocSysEvents.set(name, { element, handler: boundHandler });
                }
            }
        }
    }

    /**
     * Unbinds the document system input event handlers from the specified element.
     * 
     * @param element - The HTML element from which to unbind the event handlers.
     */
    unbindDocSysEvent(element: HTMLElement) {
        for (const [name] of Object.entries(this.docSysEventHandlers)) {
            const bindObj = this.boundDocSysEvents.get(name);
            element.removeEventListener(name, (bindObj?.handler as EventListener));
        }
    }


    /**
     * Adds a hook function before and after the default event handlers for document-level event control.
     * 
     * @param hookBefore - The hook function to be executed before the default event handlers.
     * @param hookAfter - The hook function to be executed after the default event handlers.
     */
    addDocEventHook(name: SysEventsEnum, hook: (e: Event, state:AditorDocState, view: AditorDocView) => void, type: 'before' | 'after' = 'before') {
        if(type == 'before'){
            this.docSysEventHookBefore.get(name)?.push(hook)
        }
    }

    /**
     * Removes the hook functions from the document-level event control.
     */
    removeDocEventHook(name: SysEventsEnum, hool: (e: Event, state:AditorDocState, view: AditorDocView) => void, type: 'before' | 'after' = 'before') {
        if(type == 'before'){
            const hooks = this.docSysEventHookBefore.get(name)
            if(hooks){
                const index = hooks.findIndex(_ => _ === hool)
                if(index !== -1){
                    hooks.splice(index, 1)
                }
            }
        }
    }

    /**
     * Binds the system input event to the specified element.
     * If you need control special component system input events, you can use this function.
     * 
     * @param element - The HTML element to bind the event to.
     * @param callfuncs - An object containing callback functions for each system input event.
     */
    bindSysEvent(element: HTMLElement, callfuncs: SysEventsHandler) {
        for (const name of Object.values(SysEventsEnum)) {
            if (name in callfuncs) {
                const boundHandler = (e: any) => callfuncs[name]!(e as any, this.docState, this);
                if (name === 'mousewheel')
                    element.addEventListener('mousewheel', boundHandler, { passive: true });
                else
                    element.addEventListener(name, boundHandler);

                if (!this.boundSysEvents.has(name)) {
                    this.boundSysEvents.set(name, []);
                }
                this.boundSysEvents.get(name)!.push({ element, handler: boundHandler });
            }
        }
    }

    /**
     * Unbinds system input event handlers from the specified element.
     * 
     * @param element - The HTML element from which to unbind the system input event handlers.
     */
    unbindSysEvent(element: HTMLElement) {
        for (const [name] of Object.entries(this.sysEventHandlers)) {
            const handlers = this.boundSysEvents.get(name);
            if (handlers) {
                for (const { element: boundElement, handler } of handlers) {
                    if (boundElement === element) {
                        element.removeEventListener(name, handler);
                    }
                }
            }
        }
    }


    /**
     * Binds the system input event to the specified element.
     */
    dispatchViewEvent(e: Event, actionName: ViewEventEnum, vsels: VirtualSelection[], states: AditorDocState, data: any = {}) {
        const copyState = states.copySelf()
        console.log("selection ", vsels[0], "dispatch event")
        const vselsNode = copyState.copySels(vsels)

        if (actionName === ViewEventEnum.DELETE_SELECTIONS) {
            this.deleteSelections(vselsNode, copyState)
        } else if (actionName === ViewEventEnum.INSERT_SELECTIONS) {
            this.insertSelections(vselsNode, copyState, data)
        } else if (actionName === ViewEventEnum.REPLCAE_SELECTIONS) {
            this.replaceSelections(vselsNode, copyState, data)
        } else if (actionName === ViewEventEnum.BACKSPACE_SELECTIONS) {
            this.backspaceSelections(vselsNode, copyState)
        } else if (actionName === ViewEventEnum.ENTER_SELECTIONS) {
            this.enterSelections(vselsNode, copyState)
        } else if (actionName === ViewEventEnum.INSERT_NODES_SELECTIONS) {
            this.insertNodesSelections(vselsNode, copyState, data)
        }

        copyState.calPosition()
        // Merge all nodes below the parent node of the selected node
        vselsNode.forEach((sel) => {
            const mergeNode = sel.startNode ? copyState.findNodeParentNodeByPos(sel.startNode.start) : null
            if(mergeNode)
                mergeNode.selfMerge(mergeNode.start, mergeNode.end, [sel])
        })


        states.root.children = copyState.root.children
        states.sels.setSelectionsByNodeSelection(vselsNode)
        console.log("stay sels: ", vselsNode[0])
        nextTick(() => setDOMSelection(this, states.sels.selections))
    }


    deleteSelections(vsels: NodeSelectionType[], states: AditorDocState) {
        for (const sel of vsels) {
            if (sel.startNode == null || sel.endNode == null)
                continue
            const LCANode = states.dfsFindLCANode(sel.startNode, sel.endNode)
            states.deleteNodeByPos(sel.startNode.start + sel.startOffset, sel.endNode.start + sel.endOffset)
            if (LCANode != null && LCANode.length >= 3) {
                states.mergeNode(LCANode[1], LCANode[2])
            }
            states.calPosition()
        }

        for (const sel of vsels) {
            sel.endNode = sel.startNode
            sel.endOffset = sel.startOffset
        }
    }

    insertSelections(vsels: NodeSelectionType[], states: AditorDocState, data: any = {}) {
        // Todo:
        // Beta Only Text
        const text: string = data?.text

        for (const sel of vsels) {
            if (sel.startNode == null || sel.endNode == null)
                continue
            const insertNode = states.insertTextByPos(text, sel.startNode.start + sel.startOffset)
            if (insertNode != null && insertNode.id == sel.startNode.id) {
                sel.startNode = insertNode
                sel.endNode = insertNode
                sel.startOffset = sel.startOffset + text.length
                sel.endOffset = sel.startOffset
            }
            states.calPosition()
        }
    }

    replaceSelections(vsels: NodeSelectionType[], states: AditorDocState, data: any = {}) {
        for (const sel of vsels) {
            if (sel.startNode == null || sel.endNode == null)
                continue
            const LCANode = states.dfsFindLCANode(sel.startNode, sel.endNode)
            states.deleteNodeByPos(sel.startNode.start + sel.startOffset, sel.endNode.start + sel.endOffset)
            if (LCANode != null && LCANode.length >= 3) {
                states.mergeNode(LCANode[1], LCANode[2])
            }
            const insertNode = states.insertTextByPos(data.text, sel.startNode.start + sel.startOffset)
            if (insertNode != null && insertNode.id == sel.startNode.id) {
                sel.startNode = insertNode
                sel.endNode = insertNode
                sel.startOffset = sel.startOffset + data.text.length
                sel.endOffset = sel.startOffset
            }
            states.calPosition()
        }

        for (const sel of vsels) {
            sel.endNode = sel.startNode
            sel.endOffset = sel.startOffset
        }
    }

    backspaceSelections(vsels: NodeSelectionType[], states: AditorDocState) {
        for (const sel of vsels) {
            if (sel.startNode == null || sel.endNode == null)
                continue

            // If is a single selection area, then search for the previous node through recursion
            if (sel.startNode.start + sel.startOffset === sel.endNode.start + sel.endOffset) {
                const _recursiveFindPrevNode = (_start: number, _startNode: AditorChildNode | AditorLeafNode): { node: AditorChildNode | AditorLeafNode, offset: number } | null => {
                    if (_startNode == null)
                        return null
                    const prevPos = _start - 1
                    if (prevPos <= 0) {
                        return null
                    }
                    const prevNode = states.findNodeByPos(prevPos)
                    if (prevNode == null)
                        return null
                    const parentNode = states.findNodeParentNodeByPos(_start)
                    if (parentNode == null)
                        return null

                    // if prev node is the same as the start node stop the recursive,and return node and prevPos
                    if (_startNode.id === prevNode.id) {
                        return { node: prevNode, offset: prevPos - prevNode.start }
                    } else if (parentNode.id !== prevNode.id) { // if prev node is not the parent node, return prevNode and Pos
                        if (prevNode instanceof AditorChildNode) {
                            const prevNodeRightChildNode = prevNode._dfsDeepestRightEndNode()
                            return {node: prevNodeRightChildNode, offset: prevNodeRightChildNode.length()}
                        } else {
                            return { node: prevNode, offset: prevNode.length()-1}
                        }
                    } else if (parentNode.id === prevNode.id) { // if prev node is the parent node, stop the recursive, and return node and prevPos
                        return _recursiveFindPrevNode(prevPos, prevNode)
                    } else {
                        console.error("[backspaceSelections]Unknow find prev node")
                        return null
                    }
                }
                const reFindNode = _recursiveFindPrevNode(sel.startNode.start + sel.startOffset, sel.startNode)

                if (reFindNode != null) {
                    sel.startNode = reFindNode.node
                    sel.startOffset = reFindNode.offset
                }
            }

            const LCANode = states.dfsFindLCANode(sel.startNode, sel.endNode)
            states.deleteNodeByPos(sel.startNode.start + sel.startOffset, sel.endNode.start + sel.endOffset)
            if (LCANode != null && LCANode.length >= 3) {
                states.mergeNode(LCANode[1], LCANode[2])
            }
            states.calPosition()
        }

        for (const sel of vsels) {
            sel.endNode = sel.startNode
            sel.endOffset = sel.startOffset
        }
    }

    enterSelections(vsels: NodeSelectionType[], states: AditorDocState) {
        // First delete the selection
        for (const sel of vsels) {
            if (sel.startNode == null || sel.endNode == null)
                continue
            const LCANode = states.dfsFindLCANode(sel.startNode, sel.endNode)
            states.deleteNodeByPos(sel.startNode.start + sel.startOffset, sel.endNode.start + sel.endOffset)
            if (LCANode != null && LCANode.length >= 3) {
                states.mergeNode(LCANode[1], LCANode[2])
            }
            states.calPosition()
            sel.endNode = sel.startNode
            sel.endOffset = sel.startOffset
        }

        // Locate startNode's parent node
        for (const sel of vsels) {
            if (sel.startNode == null || sel.endNode == null)
                continue
            const parentNode = states.findNodeParentNodeByPos(sel.startNode.start + sel.startOffset)
            if (parentNode == null)
                continue
            const ancestorNode = states.findNodeParentNodeByPos(parentNode.start)
            if (ancestorNode == null)
                continue

            // find startNode's parent node's index
            const parentIndex = ancestorNode.children.findIndex((node) => node.id === parentNode.id)
            // Insert a new node
            const splitContent = parentNode.split(sel.startNode.start + sel.startOffset)

            if (splitContent instanceof AditorChildNode) {
                ancestorNode.children.splice(parentIndex + 1, 0, splitContent)
                states.calPosition()
                sel.startNode = splitContent._dfsDeepestLeftStartNode()
                sel.startOffset = 0
                sel.endNode = sel.startNode
                sel.endOffset = sel.startOffset
            }
        }

    }

    insertNodesSelections(vsels: NodeSelectionType[], states: AditorDocState, data: any = {}) {
        for (const sel of vsels) {
            if (sel.startNode == null || sel.endNode == null)
                continue
            const LCANode = states.dfsFindLCANode(sel.startNode, sel.endNode)
            states.deleteNodeByPos(sel.startNode.start + sel.startOffset, sel.endNode.start + sel.endOffset)
            if (LCANode != null && LCANode.length >= 3) {
                states.mergeNode(LCANode[1], LCANode[2])
            }
            states.calPosition()
            sel.endNode = sel.startNode
            sel.endOffset = sel.startOffset
        }

        // Locate startNode's parent node
        for (const sel of vsels) {
            if (sel.startNode == null || sel.endNode == null)
                continue
            const parentNode = states.findNodeParentNodeByPos(sel.startNode.start + sel.startOffset)
            if (parentNode == null)
                continue
            const ancestorNode = states.findNodeParentNodeByPos(parentNode.start)
            if (ancestorNode == null)
                continue

            // find startNode's parent node's index
            const parentIndex = ancestorNode.children.findIndex((node) => node.id === parentNode.id)
            console.log(`split sel startNode ${sel.startNode.start} startOffset ${sel.startOffset}`)
            // Insert a new node
            const splitContent = parentNode.split(sel.startNode.start + sel.startOffset)
            // There is a difference between enterSelections and insertNodesSelections
            // enter will insert a new node, whatever the splitContent is empty or not
            // insertNodes will not insert splitContent if it is empty
            if (splitContent) {
                if (!splitContent._isEmpty()) {
                    ancestorNode.children.splice(parentIndex + 1, 0, splitContent)
                }
            }
            states.calPosition()
            // Get node list from data
            const nodeList = data.nodeList
            for (let i = 0; i < nodeList.length; i++) {
                const node = nodeList[i]
                // try insert node to startNode, if fall, try insert node to parentNode, if fall, try insert node to ancestorNode
                const insertNode = states.insertNodeByPos(node, sel.startNode.start + sel.startOffset)
                states.calPosition()
                if (insertNode) {
                    sel.startNode = insertNode._dfsDeepestRightEndNode()
                    sel.startOffset = sel.startNode.length()
                    sel.endNode = sel.startNode
                    sel.endOffset = sel.startOffset
                    if (i === nodeList.length - 1) {
                        // if last node type is adtiorText, execute backspace
                        // make sure copy span element inline
                        sel.startNode = insertNode._dfsDeepestRightEndNode()
                        sel.startOffset = sel.startNode.length()
                        sel.endNode = sel.startNode
                        sel.endOffset = sel.startOffset
                        this.backspaceSelections(vsels, states)
                    }
                }
            }
        }
    }

}

function genDefaultSysInputEventHandlers(): SysEventsHandler {
    return {
        keydown: (e: KeyboardEvent, docState: AditorDocState, docView: AditorDocView) => {
            const ctrlKey = e.ctrlKey
            const shiftKey = e.shiftKey
            const altKey = e.altKey
            if (docView.isComposing || e.key == 'Process') {
                e.preventDefault()
                return
            } else if ((e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight")) {
                docState.sels.updateSelections()
                return
            } else if (e.key == "Backspace" || e.key == "Delete") {
                e.preventDefault()
                docState.sels.updateSelections()
                docView.dispatchViewEvent(e, ViewEventEnum.BACKSPACE_SELECTIONS, docState.sels.selections, docState)
                return
            } else if (e.key == 'Enter') {
                e.preventDefault()
                docState.sels.updateSelections()
                docView.dispatchViewEvent(e, ViewEventEnum.ENTER_SELECTIONS, docState.sels.selections, docState)
                return
            } else if (ctrlKey && e.key === 'v') { // 粘贴事件
                e.preventDefault()
                docState.sels.updateSelections()
                navigator.clipboard.read().then(clipItems => {
                    clipItems.forEach(clipItem => {
                        // Check if 'text/html' type is available
                        const htmlType = clipItem.types.find(type => type === 'text/html');
                        if (htmlType) {
                            // If 'text/html' type is available, fetch it
                            clipItem.getType(htmlType).then(data => {
                                data.text().then(htmlText => {
                                    const pasteANodeList = loadJSON2ANode(str2AditorDocJson(htmlText));
                                    // filter isEmpty node 
                                    pasteANodeList.filter(_ => !_._isEmpty())
                                    pasteANodeList.forEach(_ => _.selfMerge(0, Number.MAX_SAFE_INTEGER, []))
                                    docView.dispatchViewEvent(e, ViewEventEnum.INSERT_NODES_SELECTIONS, docState.sels.selections, docState, { nodeList: pasteANodeList });
                                });
                            });
                        } else {
                            // If 'text/html' type is not available, fetch the first available type
                            clipItem.getType(clipItem.types[0]).then(data => {
                                data.text().then(text => {
                                    const textNodes = loadText2Node(text)
                                    docView.dispatchViewEvent(e, ViewEventEnum.INSERT_NODES_SELECTIONS, docState.sels.selections, docState, { nodeList: textNodes });
                                });
                            });
                        }
                    });
                });
                return
            } else if (ctrlKey && e.key === 'c') { // 复制事件
                return
            } else if (ctrlKey && e.key === 's') { // 保存事件
                e.preventDefault()
                // this.customEvent.save.map(func => func(e, this))
                return
            } else if (ctrlKey && e.key === 'a') { // 选中全部事件
                // e.preventDefault()
                return
            } else if (ctrlKey && e.key === 'z') { // 向后回滚记录
                e.preventDefault()
                // this.undo()
                return
            } else if (ctrlKey && e.key === 'y') { // 向前回滚记录
                e.preventDefault()
                // this.redo()
                return
            } else if (e.key === "F5") { // 刷新
                return
            } else if (!ctrlKey && !altKey
                && (KEY_CODE.keyCodeAlphabet.includes(e.keyCode) || KEY_CODE.keyCodeNumber.includes(e.keyCode) || Object.prototype.hasOwnProperty.call(KEY_CODE.keyCodeSymbol, e.keyCode))) {
                docState.sels.updateSelections()
                docView.dispatchViewEvent(e, ViewEventEnum.REPLCAE_SELECTIONS, docState.sels.selections, docState, { text: e.key })
                e.preventDefault()
                return
            }
        },
        keyup: (e: KeyboardEvent, docState: AditorDocState, docView: AditorDocView) => {
            e.preventDefault()
        },
        keypress: (e: KeyboardEvent, docState: AditorDocState, docView: AditorDocView) => {
            e.preventDefault()
        },
        click: (e: MouseEvent, docState: AditorDocState, docView: AditorDocView) => {
            docView.docSysEventHookBefore.get(SysEventsEnum.click)?.forEach((func) => func(e, docState, docView))
            e.preventDefault()
            docState.sels.updateSelections()
        },
        mousedown: () => { },
        mouseleave: () => { },
        mouseup: () => {
        },
        blur: () => { },
        mouseover: () => { },
        mousewheel: () => { },
        compositionstart: (e: CompositionEvent, docState: AditorDocState, docView: AditorDocView) => {
            docState.sels.updateSelections()
            collapseDOMSelection()
            if (docView.isComposing == false) {
                docView.isComposing = true
                docView.dispatchViewEvent(e, ViewEventEnum.DELETE_SELECTIONS, docState.sels.selections, docState)
            }
        },
        compositionend: (e: CompositionEvent, docState: AditorDocState, docView: AditorDocView) => {
            collapseDOMSelection()
            docView.composingTimeout = window.setTimeout(() => {
                docView.dispatchViewEvent(e, ViewEventEnum.INSERT_SELECTIONS, docState.sels.selections, docState, { text: e.data })
                docView.isComposing = false
            }, 50)
            e.preventDefault()
        },
        input: (e: InputEvent, docState: AditorDocState, docView: AditorDocView) => {
            if (docView.isComposing && e.inputType == 'insertText') {
                if (docView.composingTimeout) {
                    clearTimeout(docView.composingTimeout)
                }
                docView.dispatchViewEvent(e, ViewEventEnum.INSERT_SELECTIONS, docState.sels.selections, docState, { text: e.data })
            }
            e.preventDefault()


        },
        drag: () => { },
        dragsart: () => { },
        drop: () => { }
    }
}

function genDefaultSysInputEventHook(): Map<SysEventsEnum, ((e: Event, state: AditorDocState, view: AditorDocView) => void)[] > {
    const _map = new Map();
    for (const name of Object.values(SysEventsEnum)) {
        _map.set(name, []);
    }
    return _map
}

function genGlobalSysInputEventHandlers(): SysEventsHandler {
    return {
        click: (e: Event, docState: AditorDocState, docView: AditorDocView) => {
        },
    }
}

const KEY_CODE = {
    keyCodeAlphabet: [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],//字母a到zA到Z
    keyCodeNumber: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105],//数字0-9
    keyCodeSymbol: { // Special Char
        32: " ",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        189: "-_",
        190: ".>",
        191: "/?",
        192: "`~",
        186: ";:",
        187: "=+",
        188: ",<",
        219: "[{",
        220: "\\|",
        221: "]}",
        222: '"',
    },
    keyEnter: [108, 13],
    KEY_UP: 38,
    KEY_LEFT: 37,
    KEY_DOWN: 40,
    KEY_RIGHT: 39,
    KEY_DELETE: 8
}