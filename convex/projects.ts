import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const create = mutation({
    args: { 
        name: v.string(),
     },
     handler: async (ctx, args ) => {
        const idenity = await ctx.auth.getUserIdentity();
        if(!idenity){
            throw new Error("Unauthorized");   

        }
        await ctx.db.insert("projects",{
            name: args.name,
            ownerId: idenity?.subject,
        } );
     },
});
export const get = query({
    args:{},
    handler:async (ctx) => {
        const idenity = await ctx.auth.getUserIdentity();

        if(!idenity){
            return [];  

        }
   
        return await ctx.db
        .query("projects")
        .withIndex("by_owner", (q) => q.eq("ownerId", idenity.subject))
        .collect();
    },
});