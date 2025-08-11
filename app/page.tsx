"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VoiceAssistant from "./components/voice-assistant";

export default function Home() {
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
  };

  if (!isStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Voice Assistant
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Start your conversation with AI
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleStart}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              Start Voice Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <VoiceAssistant />;
}
