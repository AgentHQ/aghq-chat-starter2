import fetch from "node-fetch";
import express from "express";
// Removed
// const elevenLabsApiBaseUrl = import.meta.env.VITE_ELEVENLABS_API_BASE_URL;
// const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
// const elevenLabsVoiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

// Added
const googleCloudLanguageCode = import.meta.env.VITE_GOOGLE_CLOUD_LANGUAGE_CODE;
const googleCloudVoiceID = import.meta.env.VITE_GOOGLE_CLOUD_VOICE_ID;
const googleCloudApiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;


// Updated function to use Google Cloud Text-to-speech
async function textToSpeech(text) {
  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleCloudApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        text: text,
      },
      voice: {
        languageCode: googleCloudLanguageCode,
        name: googleCloudVoiceID,
      },
      audioConfig: {
        audioEncoding: "LINEAR16",
        pitch: 6.0, // Adjust the pitch
        speakingRate: 1.0, // Adjust the speaking rate
      },
    }),
  });


  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error details:', errorText);
    throw new Error(`Text-to-speech API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  const audioBuffer = Buffer.from(data.audioContent, "base64");
  return audioBuffer;
}



let endpoint = "https://app.agent-hq.io";
if (import.meta.env.VITE_AGHQ_ENDPOINT) {
  endpoint = import.meta.env.VITE_AGHQ_ENDPOINT;
}

const api_access_token = import.meta.env.VITE_AGHQ_API_ACCESS_TOKEN;

const agent_id = import.meta.env.VITE_AGHQ_AGENT_ID;

const app = express();
app.use(express.json());


app.post("/api", async (req, res) => {
  try {
    const response = await fetch(`${endpoint}/api/v1/agents/${agent_id}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_access_token}`,
      },
      body: JSON.stringify({
        input: req.body.input,
        history: req.body.history,
      }),
    });

    if (!response.ok) {
      console.error('Error with AGHQ request:', await response.text());
      return res.status(response.status).send('Error with AGHQ request');
    }

    const data = await response.json();
    const textResponse = data.result;

    // Removed the old ElevenLabs TTS request
    // Replaced with the updated textToSpeech function
    const audioBuffer = await textToSpeech(textResponse);
    const audioData = audioBuffer.toString("base64");

    res.status(200).json({ text: textResponse, audioData });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send('Unexpected error');
  }
});








export const handler = app;
