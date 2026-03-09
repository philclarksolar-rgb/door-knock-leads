"use client";

import React from "react";
import { FileText, Mic, MicOff } from "lucide-react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function LeadNotes({
  noteText,
  setNoteText,
  onAddNote,
  notes
}: any) {

  const [isDictating, setIsDictating] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  function startDictation() {

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice dictation not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsDictating(true);
    recognition.onend = () => setIsDictating(false);

    recognition.onresult = (event: any) => {

      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setNoteText((prev: string) => {
        const base = prev.trim();
        const next = transcript.trim();
        if (!next) return prev;
        return base ? `${base} ${next}` : next;
      });

    };

    recognition.start();
  }

  function stopDictation() {

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsDictating(false);
  }

  return (
    <div className="space-y-3 rounded-2xl border p-4">

      <div className="flex items-center gap-2 font-medium">
        <FileText className="h-4 w-4" />
        Notes
      </div>

      <div className="flex gap-2">

        {!isDictating ? (
          <button
            onClick={startDictation}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-white"
          >
            <Mic className="h-4 w-4"/>
            Dictate
          </button>
        ) : (
          <button
            onClick={stopDictation}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-white"
          >
            <MicOff className="h-4 w-4"/>
            Stop
          </button>
        )}

      </div>

      <textarea
        value={noteText}
        onChange={(e)=>setNoteText(e.target.value)}
        className="w-full rounded-xl border p-3"
        placeholder="Type or dictate note"
      />

      <button
        onClick={onAddNote}
        className="rounded-xl bg-slate-900 px-4 py-2 text-white"
      >
        Add Note
      </button>

      <div className="space-y-2">

        {notes?.slice().reverse().map((n:any)=>(
          <div key={n.id} className="rounded-xl border p-2 text-sm">
            {n.text}
          </div>
        ))}

      </div>

    </div>
  );
}
