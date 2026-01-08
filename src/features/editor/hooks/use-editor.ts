import { Id } from "@/../convex/_generated/dataModel";
import { useEditorStore } from "../store/use-editor-store";
import { useCallback } from "react";

export const useEditor =(projectId :Id<"projects">)=>{

    const store = useEditorStore();
    const tabState = useEditorStore((state)=> state.getTabState(projectId));

    const openFile = useCallback((
        fileId: Id<"files">,
         options: {pinned: boolean}
    )=>{
        store.openFile(fileId, projectId, options);
    },[projectId, store]);

    const closeTab = useCallback((
        fileId: Id<"files">
    )=>{
        store.closeTab(fileId, projectId);
    },[projectId, store]);

    const closeAllTabs = useCallback(()=>{
        store.closeAllTabs(projectId);
    },[projectId, store]);

    const setActiveTab = useCallback((
        fileId: Id<"files">
    )=>{
        store.setActiveTab(fileId, projectId);
    },[projectId, store]);

    return {
        openTabs: tabState.openTabs,
        activeTabId: tabState.activeTabId,
        previewTabId: tabState.previewTabId,
        openFile,
        closeTab,
        closeAllTabs,
        setActiveTab,
    }
}

