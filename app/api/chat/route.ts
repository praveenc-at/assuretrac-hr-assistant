import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    console.log("🤖 Chat API called with:", message)

    // Use env variable set in .env.local
    const FASTAPI_URL = process.env.FASTAPI_NGROK_URL
    if (!FASTAPI_URL) {
      throw new Error("FASTAPI_NGROK_URL is not set in .env.local")
    }

    console.log("🌐 Calling FastAPI at:", FASTAPI_URL)
    const response = await fetch(`${FASTAPI_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error(`FastAPI request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log("✅ FastAPI response:", data.reply) 

    return NextResponse.json({ response: data.reply })
  } catch (error) {
    console.error("❌ Chat API error:", error)
    return NextResponse.json({
      response: `Error connecting to FastAPI. Message was: "${request.body}"`,
    })
  }
}
