"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Square, Volume2, MessageSquare, RotateCcw } from "lucide-react"
import ChatWindow from "./chat-window"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const initializeRecording = async () => {
    try {
      console.log("🎤 Initializing microphone...")
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("📊 Audio data received:", event.data.size, "bytes")
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        console.log("🛑 Recording stopped, processing audio...")
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        audioChunksRef.current = []

        console.log("🎵 Audio blob created:", audioBlob.size, "bytes")

        if (audioBlob.size > 1000) {
          await processAudioPipeline(audioBlob)
        } else {
          console.warn("⚠️ Audio too short, skipping processing")
          setIsProcessing(false)
        }
      }

      mediaRecorderRef.current.onstart = () => {
        console.log("▶️ Recording started")
        audioChunksRef.current = []
      }

      console.log("✅ Microphone initialized successfully")
    } catch (error) {
      console.error("❌ Error accessing microphone:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const startRecording = async () => {
    if (!mediaRecorderRef.current) {
      await initializeRecording()
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
      try {
        // Stop any currently playing audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current.currentTime = 0
          setIsPlaying(false)
        }

        console.log("🎙️ Starting recording...")
        mediaRecorderRef.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error("❌ Error starting recording:", error)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        console.log("🛑 Stopping recording...")
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        setIsProcessing(true)
      } catch (error) {
        console.error("❌ Error stopping recording:", error)
        setIsRecording(false)
      }
    }
  }

  const processAudioPipeline = async (audioBlob: Blob) => {
    console.log("🔄 ===== STARTING AUDIO PROCESSING PIPELINE =====")

    try {
      // Step 1: Transcribe with OpenAI Whisper
      console.log("🎯 STEP 1: Transcribing with Whisper...")
      const transcription = await transcribeAudio(audioBlob)
      console.log("✅ STEP 1 COMPLETE: Transcription:", `"${transcription}"`)

      if (transcription.trim()) {
        // Step 2: Add user message to chat
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: transcription,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMessage])
        console.log("✅ STEP 2 COMPLETE: User message added to chat")

        // Step 3: Get AI response from FastAPI
        console.log("🎯 STEP 3: Getting AI response...")
        const aiResponse = await getAIResponse(transcription)
        console.log("✅ STEP 3 COMPLETE: AI response:", `"${aiResponse}"`)

        // Step 4: Add assistant message to chat
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        console.log("✅ STEP 4 COMPLETE: Assistant message added to chat")

        // Step 5: Convert to speech and play
        console.log("🎯 STEP 5: Converting to speech...")
        await speakText(aiResponse)
        console.log("✅ STEP 5 COMPLETE: Speech playback finished")
      } else {
        console.warn("⚠️ Empty transcription, skipping pipeline")
      }
    } catch (error) {
      console.error("❌ Error in processing pipeline:", error)
      alert("Error processing audio. Please try again.")
    } finally {
      setIsProcessing(false)
      console.log("🔄 ===== PIPELINE COMPLETE =====")
    }
  }

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    console.log("🎤 Sending to Whisper API...")
    const formData = new FormData()
    formData.append("audio", audioBlob, "recording.webm")

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Transcription error:", errorText)
      throw new Error(`Transcription failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.transcription || ""
  }

  const getAIResponse = async (text: string): Promise<string> => {
    console.log("🤖 Calling FastAPI with:", text)
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Chat API error:", errorText)
      throw new Error(`AI response failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response || "Sorry, I could not process your request."
  }

  const speakText = async (text: string) => {
    try {
      setIsPlaying(true)
      console.log("🔊 Converting to speech:", text)

      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ TTS error:", errorText)
        throw new Error(`Speech synthesis failed: ${response.statusText}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      currentAudioRef.current = new Audio(audioUrl)

      return new Promise<void>((resolve, reject) => {
        if (currentAudioRef.current) {
          currentAudioRef.current.onended = () => {
            console.log("🔊 Speech playback completed")
            setIsPlaying(false)
            URL.revokeObjectURL(audioUrl)
            resolve()
          }

          currentAudioRef.current.onerror = (error) => {
            console.error("❌ Audio playback error:", error)
            setIsPlaying(false)
            URL.revokeObjectURL(audioUrl)
            reject(error)
          }

          currentAudioRef.current.play()
        }
      })
    } catch (error) {
      console.error("❌ Error in speech synthesis:", error)
      setIsPlaying(false)
      throw error
    }
  }

  const endChat = () => {
    console.log("🔄 Ending chat and starting new conversation")

    // Stop any ongoing processes
    if (isRecording && mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      setIsPlaying(false)
    }

    // Clear messages
    setMessages([])
    setIsProcessing(false)

    console.log("✅ Chat ended, ready for new conversation")
  }

  const getStatusText = () => {
    if (isRecording) return "Recording your voice..."
    if (isProcessing) return "Processing speech..."
    if (isPlaying) return "AI is speaking..."
    return "Ready to record"
  }

  const getStatusColor = () => {
    if (isRecording) return "bg-red-500 animate-pulse"
    if (isProcessing) return "bg-yellow-500 animate-pulse"
    if (isPlaying) return "bg-blue-500 animate-pulse"
    return "bg-green-400"
  }

  const canRecord = !isRecording && !isProcessing && !isPlaying

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Recording Controls */}
      <div className="w-1/2 p-6 border-r border-gray-200">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full space-y-8">
            {/* Status Indicator */}
            <div className="flex flex-col items-center space-y-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getStatusColor()}`}>
                {isRecording ? (
                  <Mic className="w-10 h-10 text-white" />
                ) : isPlaying ? (
                  <Volume2 className="w-10 h-10 text-white" />
                ) : isProcessing ? (
                  <MessageSquare className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </div>

              <div className="text-center">
                <p className="text-xl font-semibold">{getStatusText()}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {isRecording
                    ? "Click Stop when you're done speaking"
                    : isProcessing
                      ? "Converting speech to text and getting AI response..."
                      : isPlaying
                        ? "Listen to the AI response..."
                        : "Click Record to start speaking"}
                </p>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-col space-y-4 w-full max-w-xs">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={!canRecord}
                  size="lg"
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  {isProcessing ? "Processing..." : isPlaying ? "AI Speaking..." : "Record"}
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              )}

              <Button
                onClick={endChat}
                variant="outline"
                size="lg"
                className="w-full bg-transparent"
                disabled={isRecording || isProcessing}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                End Chat & Start New
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-500 max-w-md">
              <p className="mb-2">
                <strong>How to use:</strong>
              </p>
              <ol className="text-left space-y-1">
                <li>1. Click "Record" and speak clearly</li>
                <li>2. Click "Stop Recording" when done</li>
                <li>3. Wait for AI to process and respond</li>
                <li>4. Listen to the AI response</li>
                <li>5. Repeat for continued conversation</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Chat Window */}
      <div className="w-1/2 p-6">
        <ChatWindow messages={messages} isProcessing={isProcessing} />
      </div>
    </div>
  )
}
