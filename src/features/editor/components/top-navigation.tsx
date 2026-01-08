import { Id } from "../../../../convex/_generated/dataModel";
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";
import { useEditor } from "../hooks/use-editor";
import { useFile } from "@/features/projects/hooks/use-file";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { FileIcon } from "@react-symbols/icons/utils";
import { X } from "lucide-react";


const Tab =({
    fileId,
    isFirst,
    projectId
}:{
    fileId: Id<"files">;
    projectId: Id<"projects">;
    isFirst: boolean;
})=>{
    const file = useFile(fileId);
    const {
        activeTabId,
        previewTabId,
        setActiveTab,
        openFile,
        closeTab
    } = useEditor(projectId);

    const isActive = activeTabId === fileId;
    const isPreview = previewTabId === fileId;
    const fileName = file?.name || "Loading";
    return (
        <div
        onClick={() => setActiveTab(fileId)}
        onDoubleClick={() => openFile(fileId, {pinned: true})}
        className={cn(
            "relative flex items-center gap-2 h-9 px-3 py-1.5 cursor-pointer text-muted-foreground group border-y border-x border-transparent ",
            isActive && "bg-background text-foreground border-x-border border-t-border border-b-background -mb-px",
            !isActive && "border-b-border",
            isFirst && "border-l-transparent!",
        )}
        >
            {file === undefined ?(
                <Spinner className="text-ring"/>
            ) :(
                <FileIcon fileName={fileName} autoAssign className="size-4 shrink-0"/>
            )} 
            <span 
                className={cn(
                    "text-sm whitespace-nowrap",
                    isPreview && "opacity-70",
                )}
                style={isPreview ? { fontStyle: "italic" } : undefined}
            >{fileName}</span>
            <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeTab(fileId);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    closeTab(fileId);
                }
            }}
            className={cn(
                "p-1 rounded-sm  opacity-0 group-hover:opacity-100  transition-colors hover:bg-accent",
                isActive && "opacity-100",
            )}
            >
                <X className="size-4"/>
            </button>
           
        </div>
    );
};

export const  TopNavigation = ({projectId}: {projectId:Id<"projects">}) =>{

    const {openTabs} = useEditor(projectId);


    return (
        <ScrollArea className="flex-1">
            <nav className="bg-sidebar flex items-center h-9 border-b">
                {openTabs.map((fileId, index) => (
                    <Tab 
                        key={fileId}
                        fileId={fileId}
                        isFirst={index === 0}
                        projectId={projectId}
                    />
                ))}
            </nav>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
};
