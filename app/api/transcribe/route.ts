import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: "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",
})

export async function POST(request: NextRequest) {
  console.log("🎤 === TRANSCRIBE API CALLED ===")

  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      console.error("❌ No audio file provided")
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log("📁 Audio file:", audioFile.name, audioFile.size, "bytes")

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not configured")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("🤖 Calling OpenAI Whisper...")
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
      language: "en",
    })

    console.log("✅ Transcription completed:", `"${transcription.text}"`)

    return NextResponse.json({
      transcription: transcription.text,
      words: transcription.words,
      segments: transcription.segments,
      language: transcription.language,
      duration: transcription.duration,
    })
  } catch (error) {
    console.error("❌ Transcription error:", error)
    return NextResponse.json(
      {
        error: "Transcription failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
