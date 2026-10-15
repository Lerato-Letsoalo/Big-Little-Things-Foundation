require('dotenv').config();
const Groq = require('groq-sdk');

(async () => {
  console.log('--- Groq raw response ---');

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const r = await client.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: 'Reply with the single word: hello' }],
      max_tokens: 100
    });
    console.log(JSON.stringify(r, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  process.exit(0);
})();