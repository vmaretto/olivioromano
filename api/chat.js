const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ASSISTANT_ID = 'asst_OeoUemG1yQnCoq8LFar862NN';

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, threadId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Create or reuse thread
        let thread;
        if (threadId) {
            thread = { id: threadId };
        } else {
            thread = await openai.beta.threads.create();
        }

        // Add user message to thread
        await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: message
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: ASSISTANT_ID
        });

        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(thread.id);
            const assistantMessage = messages.data[0];
            const text = assistantMessage.content[0].text.value;

            return res.status(200).json({
                reply: text,
                threadId: thread.id
            });
        } else {
            return res.status(500).json({ error: 'Assistant run failed', status: run.status });
        }

    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
