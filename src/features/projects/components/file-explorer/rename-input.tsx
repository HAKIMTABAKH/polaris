import { useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import {FileIcon, FolderIcon} from "@react-symbols/icons/utils"
import { getItemPadding } from "./constants";
import { cn } from "@/lib/utils";
export const  RenameInput= ({
    type,
    level,
    defaultValue,
    isOpen,
    onSubmit,
    onCancel
}:{
    type: "file" | "folder",
    level: number,
    onSubmit: (name: string) => void,
    onCancel: () => void,
    defaultValue: string,
    isOpen?: boolean
}) =>{

    const [value, setValue] = useState(defaultValue);

    const handleSubmit = () => {
       const trimmedValue = value.trim() || defaultValue;
        onSubmit(trimmedValue);
    }

    return (
        <div className="flex w-full items-center gap-1 h-5.5 bg-accent/30"
        style={{
            paddingLeft: getItemPadding(level , type === "file")
        }}
       
        >
            <div className="flex items-center gap-0.5">
                    {type === "folder" && (
                        <ChevronRightIcon className={cn(
                            "size-4 shrink-0 text-muted-foreground",
                            isOpen && "rotate-90"
                        )}/>
                        )}
                    {type === "file" && (
                            <FileIcon fileName={value} autoAssign className="size-4"/>
                        )}
                    {type === "folder" && (
                        <FolderIcon folderName={value}  className="size-4"/>
                    )}
            </div>
            <input
                type="text"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none border border-ring px-1"
                onBlur={handleSubmit}
                onKeyDown={(e) => {
                    if(e.key === "Enter"){
                        handleSubmit();
                    }
                    if(e.key === "Escape"){
                        onCancel();
                    }
                }}
                onFocus={(e) => {
                    const value = e.currentTarget.value;
                    if(type === "file"){
                        const lastDotIndex = value.lastIndexOf(".");
                        if(lastDotIndex > 0){
                            e.currentTarget.setSelectionRange(0, lastDotIndex);
                        }else {
                            e.currentTarget.select();
                        }
                    }else{
                       e.currentTarget.select();
                    }
                }}


            />
        </div>
    );
}
