import { updateFile } from './../../../../../convex/files';
import { StateEffect, StateField } from "@codemirror/state";
import {
    EditorView,
    Decoration,
    DecorationSet,
    ViewPlugin,
    WidgetType,
    ViewUpdate,
    keymap,
} from "@codemirror/view";
import { Fetcher } from './fetcher';


//This is a way to send message to update state 
export const setSuggestionEffect = StateEffect.define<string | null>();

// this to hold suggestion state in the editor
const suggestionState = StateField.define<string | null>({
    create() {
        return null;
    },
    update(value, transaction) {
        //check each suggestion in the transaction
        for (const effect of transaction.effects) {
            if (effect.is(setSuggestionEffect)) {
                value = effect.value;
            }
        }
        return value;
    },
});
// WidgetType : create DOM elements to display in the editor
// toDOM() is called by CodeMirror to create the actual HTML element
class SuggestionWidget extends WidgetType {

    constructor(readonly text: string) {
        super();
    }
    toDOM() {
        const span = document.createElement("span");
        span.textContent = this.text; 
        span.style.opacity = "0.4"; // Ghost text apperance
        span.style.pointerEvents = "none"; // don't interfere with clicks
        return span;
    }
}

let debounceTimer : number | null = null;
let isWaitingForSuggestion = false;
const DEBOUNCE_TIME = 300;

let currentAbortController : AbortController | null = null;



const genratePayload = (view : EditorView, fileName : string)=>{
    const code = view.state.doc.toString();
    if (!code || code.trim().length ===0) return null;

    const cusorPostion = view.state.selection.main.head;
    const currentLine = view.state.doc.lineAt(cusorPostion);
    const cursorInLine = cusorPostion - currentLine.from;

    const previousLines : string[] = [];
    const previousLinesToFetch = Math.min(5 , currentLine.number - 1);
    for (let i = previousLinesToFetch; i>=1 ; i--) {
            previousLines.push(view.state.doc.line(currentLine.number - i).text);
        }
    const nextLines : string[] = [];
    const totalLines = view.state.doc.lines;
    const linesToFetch = Math.min(5, totalLines - currentLine.number);

    for (let i = 1; i <= linesToFetch; i++) {
        nextLines.push(view.state.doc.line(currentLine.number + i).text);
    }
    return {
        fileName,
        code,
        currentLine: currentLine.text,
        previousLines: previousLines.join("\n"),
        textBeforeCursor: currentLine.text.slice(0, cursorInLine),
        textAfterCursor: currentLine.text.slice(cursorInLine),
        nextLines: nextLines.join("\n"),
        lineNumber:  currentLine.number,
        
    }

}


const createDebouncePlugin = (fileName :string)=>{
    return ViewPlugin.fromClass(
        class{
            constructor(view: EditorView){
                this.triggerSuggestion(view);
            }
            update(update: ViewUpdate){
                if(update.docChanged || update.selectionSet){
                    this.triggerSuggestion(update.view);
                }
            }
            triggerSuggestion(view: EditorView){
                if(debounceTimer !== null){
                    clearTimeout(debounceTimer);
                }


                if(currentAbortController !== null){
                    currentAbortController.abort();
                }

                isWaitingForSuggestion = true;

                debounceTimer = window.setTimeout(async ()=>{
                    const payload = genratePayload(view, fileName);
                    if(!payload) {
                        isWaitingForSuggestion = false;
                        view.dispatch({
                            effects: setSuggestionEffect.of(null),
                        });
                        return;
                    }
                    currentAbortController = new AbortController();
                    const suggestion = await Fetcher(payload, currentAbortController.signal);

                    isWaitingForSuggestion = false;
                    view.dispatch({
                        effects: setSuggestionEffect.of(suggestion),
                    });
                }, DEBOUNCE_TIME);   
            }
            destroy(){
                if(debounceTimer !== null){
                    clearTimeout(debounceTimer);
                }
                if(currentAbortController !== null){
                    currentAbortController.abort();
                }
            } 
        }
    
    )

}

const renderPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
            this.decorations = this.build(view);
        }
        update(update: ViewUpdate) {
            //Rebuild decoration if doc changed , cursor moved, or suggestion changed
            const suggestionChanged = update.transactions.some((transaction) => {
                return transaction.effects.some((effect) => {
                    return effect.is(setSuggestionEffect)
                });
            });
            //Rebuild decoration if doc changed , cursor moved, or suggestion changed
            const shouldRebuild = update.docChanged || update.selectionSet || suggestionChanged;
            if (shouldRebuild) {
                this.decorations = this.build(update.view);
            }
        }
        build(view: EditorView) {

            if(isWaitingForSuggestion){
                return Decoration.none;
            }
            //get current suggestion form state
            const suggestion = view.state.field(suggestionState);
            if (!suggestion) {
                return Decoration.none;
            }
            //create a widget for the suggestion at the current cursor position
            const cursor = view.state.selection.main.head;
            return Decoration.set([
                Decoration.widget({
                    widget: new SuggestionWidget(suggestion),
                    side: 1, // Render after cursor (side 1), not before (side -1)
                }).range(cursor),

            ]);
        }
    },
    {decorations : (plugin) => plugin.decorations} // this tell codemirror to use the decorations from the plugin
);

const acceptSuggestionKeymap = keymap.of([
    {
        key: "Tab",
        run: (view) => {
            const suggestion = view.state.field(suggestionState);
            if(!suggestion) return false;

            const curosr = view.state.selection.main.head;
                view.dispatch({
                    //insert the suggestion text
                      changes: {
                        from: curosr,
                        insert: suggestion,
                    },
                    //move cusor to end 
                    selection: {
                        anchor: curosr + suggestion.length,
                    },
                    //clear suggestion
                    effects: setSuggestionEffect.of(null),
                  
                });
                return true; //we handled Tab, don't indent
        },
    },
]);

export const suggestion = (fileName: string) => [
    suggestionState,    //state storage
    createDebouncePlugin(fileName), //trigger suggesyion on typing
    renderPlugin,       //render the ghost text
    acceptSuggestionKeymap, // tab to accept suggestion
    
];