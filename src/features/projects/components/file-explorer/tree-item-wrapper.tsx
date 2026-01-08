import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Doc } from "../../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { getItemPadding } from "./constants";


export const TreeItemWrapper=({
    item,
    children,
    level,
    isActive,
    onClick,
    onDoubleClick,
    onRename,
    onDelete,
    onCreateFile,
    onCreateFolder,
}:{
    item:Doc<"files">;
    children:React.ReactNode;
    level:number;
    isActive?:boolean;
    onClick?:()=>void;
    onDoubleClick?:()=>void;
    onRename?:()=>void;
    onDelete?:()=>void;
    onCreateFile?:()=>void;
    onCreateFolder?:()=>void;
}) =>{
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <button 
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onKeyDown={(e)=>{
                    if(e.key === "Enter"){
                        e.preventDefault();
                        onRename?.();
                    }
                }}
                className={cn("w-full flex items-center gap-1 h-5.5 bg-transparent text-sm outline-none border-none text-left hover:bg-white/10 transition-colors cursor-pointer"
                    ,isActive && "bg-white/10"
                )}
                style={{
                    paddingLeft:getItemPadding(level,item.type ==="file")
                }}
                >
                    {children}
                </button>
            </ContextMenuTrigger>
            <ContextMenuContent
            onCloseAutoFocus={(e)=>{e.preventDefault()}}
            className="w-64"
            >
                {item.type =="folder" && (
                    <>
                    <ContextMenuItem
                    onClick={onCreateFile}
                    className="text-sm"
                    >
                        New File...
                    </ContextMenuItem>
                    <ContextMenuItem
                    onClick={onCreateFolder}
                    className="text-sm"
                    >
                        New Folder...
                    </ContextMenuItem>
                    <ContextMenuSeparator /> 
                    </>
                )}
                <ContextMenuItem onClick={onRename} className="text-sm">
                    Rename...
                    <ContextMenuShortcut>Enter</ContextMenuShortcut>
                </ContextMenuItem>
                 <ContextMenuItem onClick={onDelete} className="text-sm">
                   Delete Permanently
                    <ContextMenuShortcut>Shift+Suppr</ContextMenuShortcut>
                </ContextMenuItem>




            </ContextMenuContent>
        </ContextMenu>
    );
}
