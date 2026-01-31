import { generateText } from "ai";
import { inngest } from "./client";
import { anthropic } from "@ai-sdk/anthropic";
import { ur } from "zod/v4/locales";
import { firecrawl } from "@/lib/firecrawl";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "demo/generate" },
  async ({ event,step }) => {

     const {prompt} = event.data as {prompt: string};
     // Extract URLs from the prompt
     const urls = await step.run("fetch-urls", async () => {
          return prompt.match(URL_REGEX) || [];
     })as string[];
     // Scrape content from the URLs
     const scrapedContent = await step.run("scrape-urls", async () => {
        const results = await Promise.all(
          urls.map(async (url) => {
            const result = await firecrawl.scrape(
               url,
               {formats: ["markdown"]},
          );
          return result.markdown || null;
          })
        ) ;
        return results.filter(Boolean).join("\n\n");

     });
     // Combine scraped content with the original prompt
     const finalPrompt = scrapedContent
     ?`Context: ${scrapedContent}\n\nQuestion: ${prompt}`
     :prompt;

     // Generate a response using Claude
   await step.run("generate-text", async () => {
        return await generateText({
            model: anthropic('claude-3-5-sonnet-20241022'),
             prompt: finalPrompt,
             experimental_telemetry: { 
                isEnabled: true,
                recordInputs: true,
                recordOutputs: true,},
        })
   })
  },
);


export const demoError = inngest.createFunction(
  { id: "demo-error" },
  { event: "demo/error" },
  async ({ step }) => {
    await step.run("fail", async () => {
    throw new Error('Inngest Error: sBackground Job failed');
  });
  },
);