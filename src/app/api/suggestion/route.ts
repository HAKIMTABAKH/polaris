import { json } from '@codemirror/lang-json';
import {generateText, Output} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { google } from "@ai-sdk/google";

import { auth } from '@clerk/nextjs/server';

const suggestionSchema = z.object({

    suggestion: z
    .string()
    .describe("The code to insert at crusor, or empty string if no completion needed"),
});
const SUGGESTION_PROMPT = `You are an expert AI pair programmer. Your task is to provide a "ghost text" completion at the cursor position.

<context>
<file_name>{fileName}</file_name>
<full_code>
{code}
</full_code>
<cursor_context>
<previous_lines>{previousLines}</previous_lines>
<before_cursor>{textBeforeCursor}</before_cursor>
<after_cursor>{textAfterCursor}</after_cursor>
<next_lines>{nextLines}</next_lines>
<line_number>{lineNumber}</line_number>
</cursor_context>
</context>

<critical_constraints>
1. STOP AND RETURN EMPTY STRING if <next_lines> already contains the logic that would naturally follow <before_cursor>.
2. STOP AND RETURN EMPTY STRING if <before_cursor> ends a complete block or statement (e.g., after ";", "}", or ")").
3. DO NOT repeat any code that already exists in <after_cursor> or <next_lines>.
4. Provide ONLY the code to be inserted. Do not include markdown code blocks, explanations, or comments.
5. If a suggestion is needed, ensure it perfectly matches the indentation and style of <full_code>.
</critical_constraints>

<task>
Based on the code above, what characters should be typed exactly at the cursor position?
Respond with the completion text only. If no completion is necessary, respond with an empty string.
</task>`;

export async function POST(request: Request) {
    try{
        const {userId} = await auth();
        if(!userId){
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 403}
            );
        }
        const {
            fileName,
            code,
            currentLine,
            previousLines,
            textBeforeCusor,
            textAfterCursor,
            nextLines,
            lineNumber
        } = await request.json();

        if(!code){
            return NextResponse.json(
                {error: "Code is required"},
                {status: 400}
            );  
        }

        const prompt = SUGGESTION_PROMPT
        .replace("{fileName}", fileName)
        .replace("{code}", code)
        .replace("{currentLine}", currentLine)
        .replace("{previousLines}", previousLines)
        .replace("{textBeforeCursor}", textBeforeCusor)
        .replace("{textAfterCursor}", textAfterCursor)
        .replace("{nextLines}", nextLines)
        .replace("{lineNumber}", lineNumber.toString());

        const {output} = await generateText({
       model: google("gemini-flash-latest"),

            output:Output.object({schema: suggestionSchema}),
            prompt,
        });
        return NextResponse.json({suggestion: output.suggestion});

    }catch(e){
        console.error("suggestion error: ", e);
        return NextResponse.json(
            {error: "Failed to genrate suggestion "},
            {status: 500}
        );
    }
   
}