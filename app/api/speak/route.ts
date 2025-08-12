import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    console.log("🔊 TTS API called with:", text)

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "MFZUKuGQUsGJPQjTS4wC"

    if (!ELEVENLABS_API_KEY) {
      console.error("❌ ElevenLabs API key not configured")
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    console.log("🔊 Calling ElevenLabs API...")
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })
    console.log("🔊 ElevenLabs API response status:", response);
    console.log("ELEVENLABS_API_KEY present?", !!ELEVENLABS_API_KEY);
    console.log("ELEVENLABS_API_KEY value?", ELEVENLABS_API_KEY);
    console.log("Status:", response.status, response.statusText);
    // console.log("Body:", await response.text());


    if (!response.ok) {
      throw new Error(`ElevenLabs API request failed: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    console.log("✅ TTS completed, audio size:", audioBuffer.byteLength, "bytes")

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (error) {
    console.error("❌ TTS error:", error)
    return NextResponse.json(
      {
        error: "Text-to-speech failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
