import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import ollama from 'ollama';

// Load environment variables
dotenv.config();

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors()); // It's good practice to place cors before other middleware if you need it for all routes
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic API route
app.get('/api', (req, res) => {
  res.send('Backend is running!');
});

app.get('/models', async (req, res) => {
  try {
    const modelList = await ollama.list();
    res.json(modelList);
  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
})

app.post('/chat', async (req, res) => {
  const {model, messages, stream = false} = req.body;

  if (!model || !messages) {
        return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-allive'
      });

      const chatResponse = await ollama.chat({
        model,
        messages,
        stream: true
      })

      for await (const chunk of chatResponse) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.end();
    } else {
      const response = await ollama.chat({
        model,
        messages
      });
      res.json({ response: response.message.content });
    }
  } catch (error){
    console.error("Error during chat:", error);
    res.status(500).json({error: 'Chat request failed'});
  }
})

app.post('/generate', async (req, res) => {
  const {model, prompt} = req.body;
  if (!model || !prompt) {
    return res.status(400).json({error: 'Missing required parameters' });
  }

  try {
    const response = await ollama.generate({model, prompt });
    res.json(response);
  } catch (error){
    console.error('Error generating text:', error);
    res.status(500).json({error: 'Text generation failed'});
  }
})

app.post('/embeddings', async (req, res) => {
  const {model, input } = req.body;
  if (!model || !input) {
    return res.status(400).json({error: 'Missing required parameters'});
  }

  try {
    const response = await ollama.embed({model, input});
    res.json(response);
  } catch (error) {
    console.error("Error generating embeddings:", error);
    res.status(500).json({error: "Embedding generation failed"});
  }
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).send('<h1>Error 404: Resource Not Found</h1>');
});

/*
// MongoDB connection - Uncomment and configure if needed
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("DB connection error:", err));
*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));