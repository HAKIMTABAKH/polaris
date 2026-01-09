import { useEffect, useMemo, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import {oneDark} from "@codemirror/theme-one-dark";
import { customTheme } from "../extenstions/theme";
import { getLanguageExtension } from "../extenstions/language-extension";
import {indentWithTab} from "@codemirror/commands";
import { minimap } from "../extenstions/minimap";
import {indentationMarkers} from "@replit/codemirror-indentation-markers";
import { customSetup } from "../extenstions/custom-setup";
import { suggestion } from "../extenstions/suggestion";
import { quickEdit } from "../extenstions/quick-edit";
import { selectionTooltip } from "../extenstions/selection-tooltip";

interface Prpps{
    fileName : string,
    initialValue?:string,
    onChange : (value : string) => void;
}
export const CodeEditor = ({fileName, initialValue="", onChange} : Prpps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    const languageExtension = useMemo(() => {
        return getLanguageExtension(fileName);
    }, [fileName]);

    useEffect(() => {

        if (!editorRef.current) return;
        const view = new EditorView({
            doc: initialValue,

            parent: editorRef.current,
            extensions: [
                customSetup,
                oneDark,
                customTheme,
                languageExtension,
                keymap.of([indentWithTab]),
                minimap(),
                indentationMarkers(),
                 EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                }),
                //TO-Remove: this after by Claude API Key
                //suggestion(fileName),
               quickEdit(fileName),
               selectionTooltip(),
            ]
        });
        viewRef.current = view;
        return () => {
            view.destroy();
        }
        
    }, [languageExtension]);

    return (
        <div
            ref={editorRef}
            className="size-full pl-4 bg-background "
        />
    );

}
