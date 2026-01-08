
import { Id } from "@/../convex/_generated/dataModel";
import { create } from "zustand";

interface TabState{
    openTabs : Id<"files">[],
    activeTabId : Id<"files"> | null,
    previewTabId : Id<"files"> | null,

};
const defaultTabState : TabState = {
    openTabs : [],
    activeTabId : null,
    previewTabId : null,
};
interface EditorStore{
    tabs: Map<Id<"projects">, TabState>,
    getTabState: (projectId: Id<"projects"> )=>TabState;
    
    openFile: (
        fileId: Id<"files">,
        projectId: Id<"projects">,
        options: {pinned: boolean}
    )=>void;

    closeTab: (
        fileId: Id<"files">,
        projectId: Id<"projects">,
    )=>void;
    closeAllTabs: (
        projectId: Id<"projects">,
    )=>void;
    setActiveTab: (
        fileId: Id<"files">,
        projectId: Id<"projects">,
    )=>void;
};

export const useEditorStore = create<EditorStore>()((set, get) => ({
    tabs: new Map(),
    getTabState: (projectId: Id<"projects">)=>{
        return get().tabs.get(projectId) ?? defaultTabState;
    },

    openFile: (
        fileId,
        projectId,
        {pinned}
    )=>{
       const tabs = new Map(get().tabs);
       const state = tabs.get(projectId) ?? defaultTabState;
       const {openTabs, previewTabId} = state;
       const isOpen = openTabs.includes(fileId);

       //CASE 1: Opening as preview - replace existing preview or add new
       if(!isOpen && !pinned){
        const newTabs =  previewTabId
        ? openTabs.map((id)=> (id === previewTabId )? fileId : id)
        : [...openTabs, fileId]
        tabs.set(projectId, {
            openTabs: newTabs,
            activeTabId: fileId,
            previewTabId: fileId,
        });
        set ({tabs});
        return;
       }
       //CASE 2: Opening pinned - add new tabs
       if(!isOpen && pinned){
        tabs.set(projectId, {
            ...state,
            openTabs: [...openTabs, fileId],
            activeTabId: fileId,
        });
        set({tabs});
        return;
       }
       //CASE 3: Opening existing pinned - switch to existing
       const shouldPin = pinned &&  previewTabId === fileId;
       tabs.set(projectId, {
        ...state,
        activeTabId: fileId,
        previewTabId: shouldPin ? null : previewTabId,
       });
       set({tabs});
    },

    closeTab: (
        fileId,
        projectId
    )=>{
        const tabs = new Map(get().tabs);
        const state = tabs.get(projectId) ?? defaultTabState;
        const {openTabs, activeTabId, previewTabId} = state;
        const tabIndex = openTabs.indexOf(fileId);
        if (tabIndex === -1) return;

        const newTabs = openTabs.filter((id)=> id !== fileId);
        let newActiveTabId: Id<"files"> | null = activeTabId;
        if (activeTabId === fileId) {
            if(newTabs.length === 0){
                newActiveTabId = null;
            } else if(tabIndex >= newTabs.length){
                newActiveTabId = newTabs[newTabs.length - 1];
            }else{
                newActiveTabId = newTabs[tabIndex];
            }
        }
        tabs.set(projectId, {
            openTabs: newTabs,
            activeTabId: newActiveTabId,
            previewTabId: previewTabId === fileId ? null : previewTabId,
        });
        set({tabs});
    },

    closeAllTabs: (
        projectId
    )=>{
        const tabs = new Map(get().tabs);
        tabs.set(projectId, defaultTabState);
        set({tabs});   
    },

    setActiveTab: (
        fileId,
        projectId
    )=>{
        const tabs = new Map(get().tabs);
        const state = tabs.get(projectId) ?? defaultTabState;
        tabs.set(projectId, {
            ...state,
            activeTabId: fileId,
        });
        set({tabs});
    },
}));