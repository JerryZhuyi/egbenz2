import type { AditorDocState } from "./states";
import { collapseDOMSelection, setDOMSelection, VirtualSelection } from "./selection";
import { VNode,nextTick } from 'vue'
import { AditorChildNode, AditorLeafNode, NodeSelectionType } from "./nodes";

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

enum SysEventsEnum {
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
    INSERT_TEXT = 'insertText',
}

function genSysInputEventHandlers(): SysEventsHandler {
    let sysEventHandlers: SysEventsHandler = {};
    for (let key in SysEventsEnum) {
        sysEventHandlers[key as SysInputEventsHandlerKey] = () => {};
    }
    return sysEventHandlers;
}

/**
 * @description: The view of the document. non global events management. only manage the events of the document.
 */
export class AditorDocView{
    docState!: AditorDocState;
    vNode!: VNode;

    docSysEventHandlers: SysEventsHandler = genDefaultSysInputEventHandlers();
    boundDocSysEvents: Map<string, { element: HTMLElement, handler: (e: Event) => void }> = new Map();

    sysEventHandlers: SysEventsHandler = genSysInputEventHandlers();
    boundSysEvents: Map<string, { element: HTMLElement, handler: (e: Event) => void }[]> = new Map();

    globalSysEventsHandlers: SysEventsHandler = genGlobalSysInputEventHandlers();
    boundGlobalSysEvents: Map<string, (e: Event) => void> = new Map();

    isComposing: boolean = false;
    composingTimeout: number = -1;

    constructor(){
    }

    init(docState: AditorDocState, vNode: VNode){
        this.docState = docState
        this.vNode = vNode
    }

    bindGlobalSysEvent(rootElement: HTMLElement){
        for (const [name, handlers] of Object.entries(this.globalSysEventsHandlers)) {
            const boundHandler = (e: any) => {
                // Only Excute the handlers when the event target is not in the rootElement.
                if(!rootElement.contains(e.target as Node))
                    handlers(e, this.docState, this)
            };

            if(name === 'mousewheel') 
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
                const boundHandler = (e:any) => this.docSysEventHandlers[name]!(e as any, this.docState, this);
                if(name === 'mousewheel') 
                    element.addEventListener('mousewheel', boundHandler, { passive: true });
                else 
                    element.addEventListener(name, boundHandler);
                if (!this.boundDocSysEvents.has(name)) {
                    this.boundDocSysEvents.set(name, {element, handler: boundHandler});
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
    addDocEventHook(name:SysEventsEnum, hookBefore: () => void, hookAfter: () => void) {
        // TODO: Implement the logic to add the hook functions before and after the default event handlers.
    }

    /**
     * Removes the hook functions from the document-level event control.
     */
    removeDocEventHook() {
        // TODO: Implement the logic to remove the hook functions from the document-level event control.
    }

    /**
     * Binds the system input event to the specified element.
     * If you need control special component system input events, you can use this function.
     * 
     * @param element - The HTML element to bind the event to.
     * @param callfuncs - An object containing callback functions for each system input event.
     */
    bindSysEvent(element: HTMLElement, callfuncs:SysEventsHandler) {
        for (const name of Object.values(SysEventsEnum)) {
            if (name in callfuncs) {
                const boundHandler = (e:any) => callfuncs[name]!(e as any, this.docState, this);
                if(name === 'mousewheel') 
                    element.addEventListener('mousewheel', boundHandler, { passive: true });
                else 
                    element.addEventListener(name, boundHandler);

                if (!this.boundSysEvents.has(name)) {
                    this.boundSysEvents.set(name, []);
                }
                this.boundSysEvents.get(name)!.push({element, handler: boundHandler});
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
                for (const {element: boundElement, handler} of handlers) {
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
    dispatchViewEvent(e:Event, actionName: ViewEventEnum, vsels: VirtualSelection[], states: AditorDocState) {
        const copyState = states.copySelf()
        const vselsNode = copyState.copySels(vsels)
        let staySels: NodeSelectionType[] = []
        console.log("selection ", vsels[0], "dispatch event")

        if(actionName === ViewEventEnum.DELETE_SELECTIONS){
            staySels = this.deleteSelections(vsels, copyState)
        }else if(actionName === ViewEventEnum.INSERT_TEXT){
            if(e instanceof CompositionEvent){
                staySels = this.insertText(e.data!, vsels, copyState)
            }
        }

        const updateStaySels:VirtualSelection[] = []
        copyState.root.calPosition(-1)
        staySels.forEach(sel => {
            if(sel.startNode != null && sel.endNode != null){
                updateStaySels.push({
                    start: sel.startNode.start,
                    end: sel.endNode.start,
                    startOffset: sel.startOffset,
                    endOffset: sel.endOffset
                })
            }
        })
        console.log("stay sels: ", updateStaySels[0])
        states.root.children = copyState.root.children
        nextTick(()=>setDOMSelection(this, updateStaySels))
    }


    deleteSelections(vsels: VirtualSelection[], states: AditorDocState): NodeSelectionType[]{
        const staySels:NodeSelectionType[] = []
        
        for(const sel of vsels){
            const LCANode = states.dfsFindLCANode(states.findNodeByPos(sel.start+sel.startOffset)!, states.findNodeByPos(sel.end + sel.endOffset)!)
            states.deleteNodeByPos(sel.start + sel.startOffset, sel.end + sel.endOffset)
            // if LCANode exists, then merge start and end
            // if(LCANode != null && LCANode.length >= 3){
            //     if(LCANode[0] && LCANode[1] && LCANode[2] && LCANode[1].start != LCANode[2].start){
            //         const parentNode = states.findNodeParentNodeByPos(LCANode[2].start)
            //         if(parentNode && LCANode[1] instanceof AditorChildNode && LCANode[2] instanceof AditorChildNode){
            //             LCANode[1].merge(LCANode[2] as AditorChildNode)
            //             parentNode.children = parentNode.children.filter(node => node.id != LCANode[2].id)
            //         }else{
            //             console.warn("try merge node,but can not find parent node")
            //         }
            //     }
            // }

            staySels.push({
                startNode: states.findNodeByPos(sel.start),
                endNode: states.findNodeByPos(sel.start),
                startOffset: sel.startOffset,
                endOffset: sel.startOffset
            })
        }
        return staySels
    }

    insertText(text: string, vsels: VirtualSelection[], states: AditorDocState): NodeSelectionType[]{
        const staySels:NodeSelectionType[] = []
        for(const sel of vsels){
            // 删除指定位置
            const insertNode = states.insertTextByPos(text, sel.start + sel.startOffset)
            if(insertNode != null)
                // 保留停留位置
                staySels.push({
                    startNode: insertNode,
                    endNode: insertNode,
                    startOffset: sel.startOffset +text.length,
                    endOffset: sel.startOffset +text.length
                })
        }
        return staySels
    }

}

function genDefaultSysInputEventHandlers(): SysEventsHandler{
    return {
        keydown: (e: KeyboardEvent, docState:AditorDocState, docView:AditorDocView) => {
            e.preventDefault()
        },
        keyup: (e: KeyboardEvent, docState:AditorDocState, docView:AditorDocView) => {
            e.preventDefault()
        },
        keypress: (e: KeyboardEvent, docState:AditorDocState, docView:AditorDocView) => {
            e.preventDefault()
        },
        click: (e: MouseEvent, docState:AditorDocState, docView:AditorDocView) => {
            e.preventDefault()
            // docState.sels.updateSelections()
        },
        mousedown: () => {},
        mouseleave: () => {},
        mouseup: () => {
        },
        blur: () => {},
        mouseover: () => {},
        mousewheel: () => {},
        compositionstart: (e: CompositionEvent, docState:AditorDocState, docView:AditorDocView) => {
            docState.sels.updateSelections()
            collapseDOMSelection()
            if(docView.isComposing == false){
                docView.isComposing = true
                docView.dispatchViewEvent(e, ViewEventEnum.DELETE_SELECTIONS, docState.sels.selections, docState)
            }
        },
        compositionend: (e: CompositionEvent, docState:AditorDocState, docView:AditorDocView) => {
            collapseDOMSelection()
            docView.composingTimeout = window.setTimeout(() => {
                docView.dispatchViewEvent(e, ViewEventEnum.INSERT_TEXT, docState.sels.selections, docState)
                docView.isComposing = false
            }, 50)
            e.preventDefault()
        },
        input: (e: InputEvent, docState:AditorDocState, docView:AditorDocView) => {
            if(docView.isComposing && e.inputType == 'insertText'){
                if(docView.composingTimeout){
                    clearTimeout(docView.composingTimeout)
                }
                docView.dispatchViewEvent(e, ViewEventEnum.INSERT_TEXT, docState.sels.selections, docState)
            }
            e.preventDefault()

            
        },
        drag: () => {},
        dragsart: () => {},
        drop: () => {}
    }
}

function genGlobalSysInputEventHandlers(): SysEventsHandler{
    return {
        click: (e: Event, docState:AditorDocState, docView:AditorDocView) => {
        },
    }
}