import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

interface MessageEvent {
    messageId: Id<"messages">;
    conversationId: Id<"conversations">;
    projectId: Id<"projects">;
    message: string;
};

export const processMessage = inngest.createFunction(
    {
        id: "process-message",
        cancelOn: [
            {
                event: "message/cancel",
                if: " event.data.messageId == async.data.messageId ",
            },
        ],
        onFailure: async({event,step})=>{
            const {messageId} = event.data.event.data as MessageEvent;
             const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
             // Update the message content to indicate that the AI processing failed
             if (internalKey) {
                await step.run("update-message-on-failure", async () => {
                    await convex.mutation(api.system.updateMessageContent, {
                        internalKey,
                        messageId,
                        content: "My apologies, I encountered an error while processing your request. Please try again later."
                    });
                });
            }
        
        }
    },
    {
        event: "message/sent"
    },
    async ({ event, step }) => {
        const { messageId, conversationId, projectId, message } = event.data as MessageEvent;
        const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
        if (!internalKey) {
            throw new NonRetriableError("Polaris Internal key is not configured");
        }

        await step.sleep("wait-for-ai-processing", "5s");

        
        await step.run("update-assitant-message", async () => {
            await convex.mutation(api.system.updateMessageContent, {
                internalKey,
                messageId,
                content: "Ai processing this message TODO"
            });

        });

    }
);


