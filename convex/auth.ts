import { MutationCtx, QueryCtx } from "./_generated/server";

export const verifyAuth = async (ctx: MutationCtx | QueryCtx) => {

    const idenity = await ctx.auth.getUserIdentity();
        if(!idenity){
            throw new Error("Unauthorized");   
        }
        return idenity;
}