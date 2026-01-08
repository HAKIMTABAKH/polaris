import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, CopyMinusIcon, FilePlusCornerIcon, FolderPlusIcon } from "lucide-react";
import { useState } from "react";
import { Id } from "@/../convex/_generated/dataModel";
import { useProject } from "../../hooks/use-projects";
import { Button } from "@/components/ui/button";
import { useCreateFile, useCreateFolder, useFolderContents } from "../../hooks/use-file";
import { CreateInput } from "./create-input";
import { LoadingRow } from "./loading-row";
import { Tree } from "./tree";

export const FileExplorer = ({
    projectId
}: {
    projectId: Id<"projects">
}) => {
    const project = useProject(projectId);
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [collapseKey, setCollapseKey] = useState(0);
        const [creating, setCreating] = useState<"file" | "folder" | null>(null);

    const rootFiles = useFolderContents({
        projectId,
        parentId: undefined,
        enabled: isOpen
    });
    const createFile= useCreateFile();
    const createFolder = useCreateFolder();

    const handleCreate = (name : string) => {
        setCreating(null);
        if (creating === "file") {
            createFile({
                name,
                projectId,
                content:"",
                parentId: undefined,
            });
        } else {
            createFolder({
                name,
                projectId,
                parentId: undefined,
            });
            
        }
    };
  
    return (
    <div className="h-full bg-sidebar">
        <ScrollArea>
            <div
                role="button"
                onClick={() => setIsOpen((value) => !value)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="cursor-pointer p-1 w-full text-left flex items-center gap-0.5 h-5.5 bg-accent font-bold "
            >
                <ChevronRightIcon
                    className={cn(
                        "size-4 shrink-0 text-muted-foreground",
                        isOpen && "rotate-90"
                    )}
                />
                <p className="text-xs uppercase line-clamp-1">{project?.name ?? "Loading..."}</p>

                <div className="ml-auto flex gap-2">
                    <Button
                        className={cn(
                            "ml-auto text-muted-foreground hover:text-foreground transition-opacity",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsOpen(true);
                            setCreating("file");
                        }}
                        variant="ghost"
                        size="icon-xs"
                    >
                        <FilePlusCornerIcon className="size-3.5" />
                    </Button>
                    <Button
                        className={cn(
                            "text-muted-foreground hover:text-foreground transition-opacity ml-auto ",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsOpen(true);
                            setCreating("folder");
                        }}
                        variant="ghost"
                        size="icon-xs"
                    >
                        <FolderPlusIcon className="size-3.5" />
                    </Button>
                    <Button
                        className={cn(
                            "text-muted-foreground hover:text-foreground transition-opacity ml-auto ",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setCollapseKey((prev) => prev + 1);
                            setIsOpen(false);
                            
                        }}  
                        variant="ghost"
                        size="icon-xs"
                    >
                        <CopyMinusIcon className="size-3.5" />
                    </Button>
                </div>
            </div>
            {isOpen && (
                <>
                {rootFiles === undefined && <LoadingRow level={0}/>}
                {creating && (
                    <CreateInput
                    type={creating}
                    level={0}
                    onSubmit={handleCreate}
                    onCancel={() => setCreating(null)}
                    />
                )}
                {rootFiles?.map((item) => (
                   <Tree 
                    key={`${item._id}-${collapseKey}`}
                    item={item}
                    level={0}
                    projectId={projectId}
                    />
                ))}
                </>
            )}
        </ScrollArea>
    </div>
    );
};