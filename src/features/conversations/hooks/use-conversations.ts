import { getMessages } from './../../../../convex/converstions';
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

export const useConversation =(id :Id<"conversations"> | null)=>{
    return useQuery(api.converstions.getById, id ? {id} : "skip");
};

export const useMessages = (conversationId :Id<"conversations"> | null)=>{
    return useQuery(api.converstions.getMessages, conversationId ? {conversationId} : "skip");
};

export const useConversations =  (projectId :Id<"projects"> )=>{
    return useQuery(api.converstions.getByProject, {projectId} );
};

export const useCreateConversations = ()=>{
    return useMutation(api.converstions.create);
    //TODO : add optimistic mutation
    
};



