import OpenAi from "https://cdn.skypack.dev/openai";
import { GITHUB_TOKEN } from "./config.js";

const token = GITHUB_TOKEN;

export async function main(userCommand) {
    
    const client = new OpenAi({
        baseURL: "https://models.inference.ai.azure.com",
        apiKey: token,
        dangerouslyAllowBrowser: true
    });


    const response = await client.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a atsk analyzer. Extract the following details form the user's input:
                1. Operation (Add/Delete/Update)
                2. Task description
                3. Urgency (High/Low/Medium)
                4. Date and Time (if mentioned in yyyy-mm-ddThh:mm:ss format) 
                
                Respond in JSON format like :
                {
                "operation":"....",
                "task":"....",
                "urgency":"....",
                "datetime":"...." (or null if not specified)
                }
                
                Keep the task field case-insensitive for comparison purpose.`
            },
            {
                role:"user",
                content: userCommand
            }
        ],
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1
    });

    return response;

}