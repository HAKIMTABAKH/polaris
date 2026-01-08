import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

export const getFiles =query({
    args:{projectId: v.id("projects")},
    handler:async (ctx, args) => {
        const idenity = await verifyAuth(ctx);
        //fetch the project 
        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this project");
        }
        return await ctx.db
        .query("files")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

    },
});

export const getFile =query({
    args:{id: v.id("files")},
    handler:async (ctx, args) => {
        const idenity = await verifyAuth(ctx);
        //fetch the project 
        const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }
        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this file");
        }
        return file;

    },
});

export const getFolderContents =query({
    args:{
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
    },
    handler:async (ctx, args) => {
        const idenity = await verifyAuth(ctx);
        //fetch the project 
        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this project");
        }
        const files = await ctx.db
        .query("files")
        .withIndex("by_project_parent", (q) => 
            q.eq("projectId", args.projectId).eq("parentId", args.parentId)
         )
        .collect();
        //Sort : folder first, then files, alphabetically with each group
        return  files.sort((a,b) => {
            //folder first 
            if(a.type === "folder" && b.type === "file") return -1;
            if(a.type === "file" && b.type === "folder") return 1;

            //with same type, sort alphabetically by name
            return a.name.localeCompare(b.name);
            
        });
    },
});


/*  this what getFilePath do: 
* Builds the full path to a file by traversing up the parent chain.

* Inputx A file ID (e.g., the ID of "button.tsx")
* Output: Array of ancestors from root to file: [{ _id, name: "src" }, 
{_id, name: "components" }, { _id, name: "button.tsx" }]

* Used for: Breadcrumbs navigation (src > components > button.tsx)

*/ 
export const getFilePath =query({
    args:{id : v.id("files")},
    handler:async (ctx, args) => {
        const idenity = await verifyAuth(ctx);


        const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }
        //fetch the project 
        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this project");
        }
        const path :{_id:string, name :string }[] = [];
        let currentId : Id<"files"> | undefined = args.id;

        while(currentId){
            const file =(await ctx.db.get(currentId)) as 
                | Doc<"files">
                | undefined;
            if (!file) break;

            path.unshift({ _id: file._id, name: file.name });
            currentId = file.parentId;
        
        }
       return path;
    },
});



export const createFile =mutation({
    args:{
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
        content: v.string(),
    },
    handler:async (ctx, args) => {
        const idenity = await verifyAuth(ctx);
        //fetch the project 
        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this project");
        }

        //check if files with same name already exists in this parents folder 
        const files = await ctx.db
        .query("files")
        .withIndex("by_project_parent", (q) => 
            q.eq("projectId", args.projectId).eq("parentId", args.parentId)
         )
        .collect();

        const existingFile = files.find(
            (file) => file.name === args.name && file.type === "file"
        );

        if (existingFile) {
            throw new Error("File with same name already exists");
        }

        await ctx.db.insert("files", {
            projectId: args.projectId,
            name: args.name,
            content: args.content,
            type: "file",
            parentId: args.parentId,
            updatedAt: Date.now(),
        });
          //update project update time
        await ctx.db.patch("projects", args.projectId, {
            updatedAt: Date.now(),
        });
       
    },
});

export const createFolder =mutation({
    args:{
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
    },
    handler:async (ctx, args) => {
        const idenity = await verifyAuth(ctx);
        //fetch the project 
        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this project");
        }

        //check if folder with same name already exists in this parents folder 
        const files = await ctx.db
        .query("files")
        .withIndex("by_project_parent", (q) => 
            q.eq("projectId", args.projectId).eq("parentId", args.parentId)
         )
        .collect();

        const existingFile = files.find(
            (file) => file.name === args.name && file.type === "folder"
        );

        if (existingFile) {
            throw new Error("Folder with same name already exists");
        }

        await ctx.db.insert("files", {
            projectId: args.projectId,
            name: args.name,
            type: "folder",
            parentId: args.parentId,
            updatedAt: Date.now(),
        });
         //update project update time
        await ctx.db.patch("projects", args.projectId, {
            updatedAt: Date.now(),
        });
    },
});


export const renameFile = mutation({
    args: {
        id: v.id("files"),
        newName: v.string(),
    },
    handler: async (ctx, args) => {

         const idenity = await verifyAuth(ctx);
         const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }
        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this project");
        }

        //check if a file with same  new name already exists in this parents folder 
        const siblings = await ctx.db
        .query("files")
        .withIndex("by_project_parent", (q) => 
            q.eq("projectId", file.projectId).eq("parentId", file.parentId)
         )
        .collect();

        const existing = siblings.find(
            (sibling)=>
                sibling.name === args.newName &&
                sibling.type === file.type &&
                sibling._id !== args.id
        );
        if (existing) {
            throw new Error(`A ${file.type} with this name already exists in this location`);
        };
        //update the file name
        await ctx.db.patch("files", args.id, {
            name: args.newName,
            updatedAt: Date.now(),
        });
          //update project update time
        await ctx.db.patch("projects", project._id, {
            updatedAt: Date.now(),
        });
    },
});

export const deleteFile = mutation({
    args: {
        id: v.id("files"),
    },
    handler: async (ctx, args) => {

         const idenity = await verifyAuth(ctx);
         const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        };
        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        };
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this project");
        };

        //recursive delete file / folder abd all descendants
        const deleteRecursive = async (fileId : Id<"files">) => {
            const item = await ctx.db.get(fileId);
            if (!item){
                return;
            };
            // if it is folder delete all children first
            if (item.type === "folder") {
                const children = await ctx.db
                .query("files")
                .withIndex("by_project_parent", (q) => 
                    q.eq("projectId", item.projectId).eq("parentId", item._id)
                 )
                .collect();

                for (const child of children) {
                    await deleteRecursive(child._id);
                }
            };

            //delete storage file if it exisits
            if (item.storageId) {
                await ctx.storage.delete(item.storageId);
            };
            // delete the file/folder itself
            await ctx.db.delete(fileId);        
        };
        await deleteRecursive(file._id);
          //update project update time
        await ctx.db.patch("projects", project._id, {
            updatedAt: Date.now(),
        });
    }
});

export const updateFile = mutation({
    args: {
        id: v.id("files"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
         const idenity = await verifyAuth(ctx);
         const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        };
        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        };
        if(project.ownerId !== idenity.subject){
            throw new Error("Unauthorized to access this project");
        };

        const now = Date.now();
        //update file
        await ctx.db.patch("files", args.id, {
            content: args.content,
            updatedAt: now,
        });
        //update project update time
        await ctx.db.patch("projects", project._id, {
            updatedAt: now,
        });
    }
});
