import { auth } from '@clerk/nextjs/server';
import { json } from '@codemirror/lang-json';
import {generateText, Output} from "ai";
import { NextResponse } from "next/server";
import {   z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";

import { firecrawl } from '@/lib/firecrawl';

const QUICK_EDIT_PROMPT = `You are a code editing assistant. Edit the selected code based on the user's instruction.

<context>
<selected_code>
{selectedCode}
</selected_code>
<full_code_context>
{fullCode}
</full_code_context>
</context>

{documentation}

<instruction>
{instruction}
</instruction>

<instructions>
Return ONLY the edited version of the selected code.
Maintain the same indentation level as the original.
Do not include any explanations or comments unless requested.
If the instruction is unclear or cannot be applied, return the original code unchanged.
</instructions>`;

const URL_REGEX = /https?:\/\/[^\s]+/g;

const quickEditSchema = z.object({
    editCode: z
        .string()
        .describe(
            "The edited version of the selected code based on the instruction"
        ),
 
});

export async function POST(request: Request) {

    const {userId} = await auth();
    if(!userId){
        return NextResponse.json(
            {error: "Unauthorized"},
            {status: 403}
        );
    }
   try {
    const {selectedCode, fullCode, instruction} = await request.json();
    if(!selectedCode){
        return NextResponse.json(
            {error: "No code selected"},
             {status: 400}
        );
    }

    const urls: string[] = instruction.match(URL_REGEX) || [];
    let documentationContext = "";
    if (urls.length > 0) {
        const scrapedResults = await Promise.all(
            urls.map(async (url) => {
                try{
                    const result = await firecrawl.scrape(url, {
                        formats: ["markdown"],
                    });
                    if (result.markdown){
                        return `<doc url="${url}">\n${result.markdown}\n</doc>`;
                    }
                    return null;

                }catch  {
                    return null;
                }
            })
        );
        const validResults = scrapedResults.filter(Boolean);
        if(validResults.length > 0){
            documentationContext = `<documentation>\n${validResults.join("\n\n")}\n</documentation>`;
        }
    }
    const prompt = QUICK_EDIT_PROMPT
        .replace("{selectedCode}", selectedCode)
        .replace("{fullCode}", fullCode || "")
        .replace("{instruction}", instruction)
        .replace("{documentation}", documentationContext);

    const {output} = await generateText({
            model: anthropic("claude-3-5-sonnet-20241022"),
            output: Output.object({schema: quickEditSchema}),
            prompt,
          });

    return NextResponse.json({editedCode: output?.editCode || selectedCode});

   }catch (error) {
        console.error("Quick edit error:", error);
        return NextResponse.json(
            {error: "Failed to genrate edit"},
            {status: 500}
        );
    }
}
