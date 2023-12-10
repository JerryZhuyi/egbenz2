import type { AditorDocState } from "./states";

type HandlerEvents = Event|KeyboardEvent|MouseEvent|FocusEvent|WheelEvent|CompositionEvent|InputEvent|DragEvent
type SysEventHandler = (event: HandlerEvents, docState: AditorDocState, docView: AditorDocView) => void;
type SysInputEventKey = keyof SysEventInterface;

interface SysEventInterface {
    keydown?: SysEventHandler;
    keyup?: SysEventHandler;
    keypress?: SysEventHandler;
    click?: SysEventHandler;
    mousedown?: SysEventHandler;
    mouseleave?: SysEventHandler;
    mouseup?: SysEventHandler;
    blur?: SysEventHandler;
    mouseover?: SysEventHandler;
    mousewheel?: SysEventHandler;
    compositionstart?: SysEventHandler;
    compositionend?: SysEventHandler;
    input?: SysEventHandler;
    drag?: SysEventHandler;
    dragsart?: SysEventHandler;
    drop?: SysEventHandler;
}

enum SysEventEnum {
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
    drop = 'drop'
}

function genSysInputEventHandlers(): SysEventInterface {
    let sysEventHandlers: SysEventInterface = {};
    for (let key in SysEventEnum) {
        sysEventHandlers[key as SysInputEventKey] = () => {};
    }
    return sysEventHandlers;
}

/**
 * @description: The view of the document. non global events management. only manage the events of the document.
 */
export class AditorDocView{
    docState: AditorDocState;

    docSysEventHandlers: SysEventInterface = genDefaultSysInputEventHandlers();
    boundDocSysEvents: Map<string, { element: HTMLElement, handler: (e: Event) => void }> = new Map();

    sysEventHandlers: SysEventInterface = genSysInputEventHandlers();
    boundSysEvents: Map<string, { element: HTMLElement, handler: (e: Event) => void }[]> = new Map();

    globalSysEventsHandlers: SysEventInterface = genGlobalSysInputEventHandlers();
    boundGlobalSysEvents: Map<string, (e: Event) => void> = new Map();

    constructor(docState: AditorDocState){
        this.docState = docState
    }

    bindGlobalSysEvent(rootElement: HTMLElement){
        for (const [name, handlers] of Object.entries(this.globalSysEventsHandlers)) {
            const boundHandler = (e: Event) => {
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
        for (const name of Object.values(SysEventEnum)) {
            if (name in this.docSysEventHandlers) {
                this.docSysEventHandlers[name as SysInputEventKey] = this.docSysEventHandlers[name as SysInputEventKey]!;
                const boundHandler = (e: Event) => this.docSysEventHandlers[name as SysInputEventKey]!(e, this.docState, this);
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
    addDocEventHook(name:SysEventEnum, hookBefore: () => void, hookAfter: () => void) {
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
    bindSysEvent(element: HTMLElement, callfuncs:SysEventInterface) {
        for (const name of Object.values(SysEventEnum)) {
            if (name in callfuncs) {
                const boundHandler = (e: Event) => callfuncs[name as SysInputEventKey]!(e, this.docState, this);
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
    

}

function genDefaultSysInputEventHandlers(): SysEventInterface{
    return {
        keydown: (e: Event, docState:AditorDocState, docView:AditorDocView) => {

        },
        keyup: () => {},
        keypress: () => {},
        click: (e: Event, docState:AditorDocState, docView:AditorDocView) => {
        },
        mousedown: () => {},
        mouseleave: () => {},
        mouseup: () => {
        },
        blur: () => {},
        mouseover: () => {},
        mousewheel: () => {},
        compositionstart: () => {},
        compositionend: () => {},
        input: () => {},
        drag: () => {},
        dragsart: () => {},
        drop: () => {}
    }
}

function genGlobalSysInputEventHandlers(): SysEventInterface{
    return {
        click: (e: Event, docState:AditorDocState, docView:AditorDocView) => {
        },
    }
}