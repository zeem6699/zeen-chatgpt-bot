const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Messenger bot is running!');
});

app.post('/webhook', async (req, res) => {
  const entries = req.body.entry;
  for (const entry of entries) {
    const webhook_event = entry.messaging[0];
    const senderId = webhook_event.sender.id;

    if (webhook_event.message) {
      const userMessage = webhook_event.message.text;
      const reply = await sendToChatGPT(userMessage);
      sendMessage(senderId, reply);
    }
  }
  res.status(200).send('EVENT_RECEIVED');
});

async function sendToChatGPT(message) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT error:', error.message);
    return 'Sorry, I am having trouble understanding you right now.';
  }
}

function sendMessage(senderId, message) {
  axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
    recipient: { id: senderId },
    message: { text: message }
  }).catch(err => console.error('Facebook send error:', err.message));
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
