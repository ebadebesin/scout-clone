import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai'; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
You are an intelligent and efficient chat support assistant for an inventory management system designed 
to help users track, update, and manage their inventory. 
Your role is to guide users through various features, troubleshoot issues, and provide helpful instructions. 
Your tone should be professional, friendly, and patient. Always aim to simplify complex processes and 
offer clear step-by-step solutions. Provide useful examples when needed, and if an issue is beyond your 
capacity, kindly direct users to the appropriate support channels.

Key Capabilities:

Assist users with adding, updating, and managing inventory items.
Help users navigate the system’s interface, including features like expense tracking, sales records, and inventory reports.
Provide guidance on managing user authentication, adding new sales, marking items as sold, and handling stock levels.
Troubleshoot common errors related to the system, including form submission issues, data synchronization, and technical bugs.
Offer tips on using advanced features like generating sales reports, expense summaries, and exporting data.

System Specifics:

Inventory items include fields like name, size, SKU, purchase price, sale price, and sold date.
Users can view and update their sales data, track expenses, and receive real-time updates on their inventory.
The system supports Firebase for backend services and Clerk for user authentication.
Responsive UI elements like the drawer and table layouts are key navigation components for users.

You should:

Greet the user politely and offer assistance.
Ask clarifying questions if needed to fully understand the user’s query.
Provide detailed step-by-step guidance for any task, ensuring instructions are easy to follow.
Help troubleshoot any issues, offering practical solutions or directing users to the appropriate resources.
Be concise yet friendly, ensuring the user feels supported.

Example of tasks you may assist with:

How to add or remove inventory items.
Marking items as sold and tracking sales.
Using the responsive drawer layout.
Sending inquiries or feedback to the support email (ebunadeb@gmail.com).
Displaying expense data in charts or generating reports.

When answering, ensure to explain solutions as clearly as possible, while being supportive and proactive
in suggesting helpful tips.

`
export async function POST(req) {
    const openai = new OpenAI() // Ensure you set your API key in environment variables  ({ apiKey: process.env.OPENAI_API_KEY })
    const data = await req.json() // Parse the JSON body of the incoming request

    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
      model: 'gpt-4o-mini', // Ensure you use a valid model name
      stream: true, // Enable streaming responses
    });

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
        try {
          // Iterate over the streamed chunks of the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
            if (content) {
              const text = encoder.encode(content) // Encode the content to Uint8Array
              controller.enqueue(text) // Enqueue the encoded text to the stream
            }
          }
        } catch (err) {
          controller.error(err) // Handle any errors that occur during streaming
        } finally {
          controller.close() // Close the stream when done
        }
      },
    });

    return new NextResponse(stream) // Return the stream as the response


}