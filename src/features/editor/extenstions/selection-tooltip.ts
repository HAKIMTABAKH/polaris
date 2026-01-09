import { EditorState, StateField } from '@codemirror/state';
import { showTooltip, Tooltip } from '@codemirror/view';
import { EditorView } from "codemirror";
import { quickEditState, showQuickEditEffect } from './quick-edit';


let editorView : EditorView | null = null;
const createTooltipForSelection = (state : EditorState) : readonly Tooltip[] => {

    const selection = state.selection.main;
    if (selection.empty) {
        return [];
    }
    const isQuickEditisActive = state.field(quickEditState);
    if (isQuickEditisActive) {
        return [];
    }
    return [
        {
            pos: selection.from,
            above: false,
            strictSide: false,
            create: () => {
                const dom = document.createElement("div");
                dom.className = "bg-popover text-popover-foreground z-50 rounded-sm boder border-input p-1 shadow-md flex items-center gap-2 text-sm";
               
                const addToChatButton = document.createElement("button");
                addToChatButton.textContent = "Add to Chat";
                addToChatButton.className = "font-sans p-1 px-2 hover:bg-foreground/10 rounded-sm";

                const quickEditButton = document.createElement("button");
                quickEditButton.className = "font-sans p-1 px-2 hover:bg-foreground/10 rounded-sm gap-1";
                
                const quickEditButtonText = document.createElement("span");
                quickEditButtonText.textContent = "Quick Edit";

                const quickEditButtonShortcut = document.createElement("span");
                quickEditButtonShortcut.textContent = "Ctrl+.";
                quickEditButtonShortcut.className = "text-sm opacity-60 ml-1";

                quickEditButton.appendChild(quickEditButtonText);
                quickEditButton.appendChild(quickEditButtonShortcut);

                quickEditButton.onclick = () => {
                    if (editorView) {
                        editorView.dispatch({
                            effects: showQuickEditEffect.of(true),
                        });
                    }
                };

                dom.appendChild(addToChatButton);
                dom.appendChild(quickEditButton);
                return {dom};
                


        },
        }
    ];
        
};
const selectionTooltipField = StateField.define<readonly Tooltip[]>({
    create(state){
        return createTooltipForSelection(state);
    },

    update(tooltips, transaction) {
        if (transaction.selection || transaction.docChanged) {
            return createTooltipForSelection(transaction.state);
        }
        for (const effect of transaction.effects) {
            if (effect.is(showQuickEditEffect)) {
                return createTooltipForSelection(transaction.state);
            }
        }
        return tooltips;
    },

    provide: (field) => showTooltip.computeN(
        [field],
        (state) => state.field(field),
    )
});

const captureViewExtension = EditorView.updateListener.of((update) => {
    editorView = update.view;
});


export const selectionTooltip = ()=> [
    selectionTooltipField,
    captureViewExtension,
];
