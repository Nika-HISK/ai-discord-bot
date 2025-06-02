const { Client, GatewayIntentBits } = require('discord.js');
const { config } = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const express = require('express');

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Minimal health check endpoint so Render's port scan passes
app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.listen(PORT, () => {
  console.log(`🌐 Express server listening on port ${PORT}`);
});

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite-001:generateContent?key=' +
  process.env.GOOGLE_API_KEY;

async function generateGeminiResponse(prompt) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error('❌ Unexpected Gemini response:', data);
      return '⚠️ No reply from Gemini.';
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return '⚠️ Gemini API request failed.';
  }
}

client.once('ready', () => {

});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  const prompt = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();


  const response = await generateGeminiResponse(prompt);


  await message.reply(response);
});

client.login(process.env.DISCORD_TOKEN);
