import ky from 'ky';
import z from 'zod';
import { toast } from 'sonner';

const editRequestSchema = z.object({
    selectedCode: z.string(),
    fullCode : z.string(),
    instruction: z.string(),
});

const editResponseSchema = z.object({
    editedCode: z.string(),
});
   

type EditRequest = z.infer<typeof editRequestSchema>;
type EditResponse = z.infer<typeof editResponseSchema>;

export const Fetcher = async(
    payload: EditRequest,
    signal: AbortSignal
,
): Promise<string | null> => {
    try{
        const validatedPayload = editRequestSchema.parse(payload);
        const response = await ky
            .post("/api/quick-edit", {
                json: validatedPayload,
                signal,
                timeout:30_000,
                retry:0
            }).json<EditResponse>();
        const validatedResponse = editResponseSchema.parse(response);

        return validatedResponse.editedCode || null;
        
    }catch(err){
        if(err instanceof Error && err.name === 'AbortError'){
            return null;
        }
        toast.error("Failed to fetch Ai quick edit");
        return null
      
    }
  
}
