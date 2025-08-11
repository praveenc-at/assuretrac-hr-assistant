"use client"

import { useEffect, useRef } from "react"

interface AudioVisualizerProps {
  isRecording: boolean
  isPlaying: boolean
  analyser: AnalyserNode | null
}

export default function AudioVisualizer({ isRecording, isPlaying, analyser }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current || !analyser) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!ctx || !canvas) return

      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = "rgb(240, 240, 240)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
        if (isRecording) {
          gradient.addColorStop(0, "rgb(239, 68, 68)")
          gradient.addColorStop(1, "rgb(220, 38, 38)")
        } else if (isPlaying) {
          gradient.addColorStop(0, "rgb(59, 130, 246)")
          gradient.addColorStop(1, "rgb(37, 99, 235)")
        } else {
          gradient.addColorStop(0, "rgb(156, 163, 175)")
          gradient.addColorStop(1, "rgb(107, 114, 128)")
        }

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }

      if (isRecording || isPlaying) {
        animationRef.current = requestAnimationFrame(draw)
      }
    }

    if (isRecording || isPlaying) {
      draw()
    } else {
      // Draw static bars when not active
      ctx.fillStyle = "rgb(240, 240, 240)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const staticBars = 20
      const staticBarWidth = canvas.width / staticBars

      for (let i = 0; i < staticBars; i++) {
        const height = Math.random() * 20 + 10
        ctx.fillStyle = "rgb(156, 163, 175)"
        ctx.fillRect(i * staticBarWidth, canvas.height - height, staticBarWidth - 2, height)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, isPlaying, analyser])

  return (
    <div className="w-full max-w-md">
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="w-full h-24 border border-gray-300 rounded-lg bg-gray-50"
      />
    </div>
  )
}
