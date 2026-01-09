import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z, { success } from "zod";
import { convex } from '@/lib/convex-client';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { inngest } from "@/inngest/client";


const requestSchema = z.object({
    conversationId :z.string(),
    message: z.string(),
});

export async function POST(request: Request) {

    const {userId} = await auth();

    if(!userId){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
        return NextResponse.json({ error: "Internal Key not configured" }, { status: 500 });
    }


    const body = await request.json();
    const {conversationId, message} = requestSchema.parse(body);

    //Call convex mutation , query
    const conversation = await convex.query(api.system.getConversationById,{
        internalKey,
        conversationId: conversationId as Id<"conversations">,
    });

    if(!conversation){
        return NextResponse.json(
            {error: "Conversation not found"}, 
            {status: 404}
        );
    }
    const projectId = conversation.projectId;

    //check for processing messages
    //create user message
    await convex.mutation(api.system.createMessage,{
        internalKey,
        projectId,
        conversationId : conversationId as Id<"conversations">,
        role : "user",
        content : message,
    });

    //create the assictand message
    const assistantMessageId = await convex.mutation(api.system.createMessage,{
        internalKey,
        projectId,
        conversationId : conversationId as Id<"conversations">,
        role : "assistant",
        content : "",
        status: "processing"
    });

    //TODO invoke inggest to process message
    const event = await inngest.send({
        name: "message/sent",
        data: {
            messageId: assistantMessageId,
        },
    });

        return NextResponse.json(
            {success: true,
            eventId: event.ids[0], 
            messgaeId: assistantMessageId, 
            }
        );
    //Invoke inggest Backgound jobs 
}