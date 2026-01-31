import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { CopyIcon, HistoryIcon, LoaderIcon, Plus, X } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputMessage, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { useConversation, useConversations, useCreateConversations, useMessages } from "../hooks/use-conversations";
import { useState } from "react";
import { toast } from "sonner";
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import ky from "ky";
import { PastConversationsDialog } from "./past-conversations-dialog";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";

interface ConversationSidebarProps{
    projectId : Id<"projects">;
}

export const  ConversationSidebar = (
    {projectId} : ConversationSidebarProps      
) =>{

    const [input, setInput] = useState("");
    const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
    const createConversation = useCreateConversations();

    const conversations = useConversations(projectId);
    const activeConversationId = selectedConversationId ?? conversations?.[0]?._id ?? null;

    const [pastConversationsOpen, setPastConversationsOpen] = useState(false)

    const activeConversation = useConversation(activeConversationId);

    const conversationMessages = useMessages(activeConversationId);

    //check if any message is currenly processing
    const isProcessing = conversationMessages?.some(
        (message) => message.status === "processing"
    );

      const handleCancel = async () =>{
        try {
            await ky.post("/api/messages/cancel",{
                json: {projectId}
            });
            
        } catch  {
            toast.error("unable to cancel request")      
        }
    }

    const handleCreateConversation = async () => {
        try {
            const newConversationId = await createConversation({
                projectId,
                title: DEFAULT_CONVERSATION_TITLE,
            });
            setSelectedConversationId(newConversationId);
            return  newConversationId;
            
        } catch  {
            toast.error("Failed to create conversation");
            return null;
        }
    };

  

    const handleSubmit = async (message : PromptInputMessage) => {
      //if processing and no new messages this is just a stop function

      if(isProcessing && !message.text){
        await handleCancel()
        setInput("");
        return;
      }
      let conversationId = activeConversationId;
      if(!conversationId){
        conversationId = await handleCreateConversation();
        if (!conversationId) return;
      }
      //Trigger inggest function via api
      try {
        await ky.post("/api/messages",{
            json:{
                conversationId,
                message: message.text,
            },
        });
        
      } catch  {
        toast.error("Failed to send message");
        
      }
      setInput("");
    };


    return (
        <>
        <PastConversationsDialog
            projectId={projectId}
            open={pastConversationsOpen}
            onOpenChange={setPastConversationsOpen}
            onSelect={setSelectedConversationId}
        />
        <div className="flex flex-col h-full bg-sidebar">
            <div className="h-8.75 flex items-center justify-between border-b ">
                    <div className="text-sm truncate pl-3">
                        {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
                    </div>
                    <div className="flex items-center px-1 gap-1">
                        <Button
                            variant="highlight"
                            size="icon-xs"
                            onClick={() => setPastConversationsOpen(true)}
                            >
                            <HistoryIcon className="size-3.5 text-white"/>
                        </Button>
                         <Button
                            variant="highlight"
                            size="icon-xs"
                            onClick={handleCreateConversation}>
                            <Plus className="size-3.5 text-white"/>
                        </Button>
                    </div>
                </div>
                <Conversation className="flex-1">
                    <ConversationContent>
                        {conversationMessages?.map((message, messageIndex) => (
                            <Message 
                                key={message._id}
                                from={message.role}
                                >
                                <MessageContent>
                                    {message.status === "processing" ?(
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <LoaderIcon className="size-4 animate-spin"/>
                                            <span>Thinking...</span>
                                        </div>

                                    ): message.status === "cancelled" ? (
                                       <span className="text-muted-foreground italic">Request Cancelled </span>
                                        
                                    )
                                    
                                    :(
                                        <MessageResponse>{message.content}</MessageResponse>
                                    ) }
                                </MessageContent>
                                   {message.role === "assistant" && 
                                   message.status ==="completed" &&
                                   messageIndex === (conversationMessages?.length ?? 0) - 1 &&
                                   (
                                    <MessageActions>
                                        <MessageAction
                                            onClick={()=>{
                                                navigator.clipboard.writeText(message.content);
                                            }}
                                            label="Copy"
                                        >
                                        
                                            <CopyIcon className="size-3"/>
                                        </MessageAction>

                                    </MessageActions>

                                   )}     
                            </Message>
                           
                        ))}
                    </ConversationContent>
                    <ConversationScrollButton/>
                </Conversation>
                <div className="p-3">
                    <PromptInput
                     onSubmit={handleSubmit}
                     className="mt-2 "
                     >
                        <PromptInputBody>
                            <PromptInputTextarea 
                            placeholder="Ask a question or describe a task... "
                            onChange={(e)=>{setInput(e.target.value)}}
                            value={input}
                            disabled={isProcessing}
                            />
                        </PromptInputBody>
                        <PromptInputFooter>
                            <PromptInputTools/>
                            <PromptInputSubmit
                                disabled={isProcessing ? false : !input }
                                status={isProcessing ? "streaming" : undefined }
                            />

                        </PromptInputFooter>



                    </PromptInput>
                </div>

        </div>
        </>
    );
}
