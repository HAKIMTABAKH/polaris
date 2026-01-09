import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
    // Define tables and their fields here 
    //Project table
    projects: defineTable({
        name: v.string(),
        ownerId: v.string(),
        updatedAt : v.number(),
        importStatus: v.optional(
            v.union(
                v.literal("importing"),
                v.literal("completed"),
                v.literal("failed"),
            ),
        ),
        exportStatus: v.optional(
            v.union(
                v.literal("exporting"),
                v.literal("completed"),
                v.literal("failed"),
                v.literal("canceled")
            ),
            ),
        exportRepoUrl: v.optional(v.string()),
    }).index("by_owner", ["ownerId"]),

    //File table
    files: defineTable({
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        type: v.union(
            v.literal("file"),
            v.literal("folder"),
        ),
        name: v.string(),
        content : v.optional(v.string()),// Text files only
        storageId: v.optional(v.id("_storage")),// Binary files only
        updatedAt : v.number(),
    
    })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentId"])
    .index("by_project_parent", ["projectId", "parentId"]),

    //Converstion table
    conversations: defineTable({
        projectId: v.id("projects"),
        title: v.string(),
        updatedAt : v.number(),
    })
    .index("by_project", ["projectId"]),

    //Message table
    messages: defineTable({
        conversationId: v.id("conversations"),
        projectId: v.id("projects"),
        role: v.union(
            v.literal("user"),
            v.literal("assistant"),
        ),
        content: v.string(),
       status: v.optional(
            v.union(
                v.literal("processing"),
                v.literal("completed"),
                v.literal("canceled"),
            )),  
    })
    .index("by_conversation", ["conversationId"])
    .index ("by_project_status", ["projectId", "status"]),

});