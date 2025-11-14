import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { RecordingState } from '../types';
import { blobToBase64 } from '../utils/fileUtils';

export const RECORDING_LIMIT_SECONDS = 300; // 5 minutes

export const useAudioService = (onTranscriptionComplete: (text: string) => void, apiKey: string | null) => {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [transcriptionProgress, setTranscriptionProgress] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.stop();
            // The onstop event handler will handle the rest.
        }
    }, [recordingState]);

    const startRecording = useCallback(async () => {
        if (recordingState !== 'idle') return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            // Tenta gravar em um formato suportado (ogg), com fallback para o padrão do navegador (geralmente webm)
            const options = { mimeType: 'audio/ogg; codecs=opus' };
            const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : {});
            
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = async () => {
                stopTimer();
                setRecordingState('transcribing');
                setTranscriptionProgress(10);

                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

                // Clean up the stream tracks
                stream.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                
                if (!apiKey) {
                    console.error("API Key not provided for transcription.");
                    onTranscriptionComplete("[ERRO: Chave de API não configurada para transcrição]");
                    setRecordingState('idle');
                    setTranscriptionProgress(0);
                    return;
                }

                try {
                    setTranscriptionProgress(30);
                    const base64Audio = await blobToBase64(audioBlob);
                    setTranscriptionProgress(60);

                    const ai = new GoogleGenAI({ apiKey });
                    const audioPart = { inlineData: { mimeType, data: base64Audio } };
                    
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { parts: [audioPart, { text: "Transcreva este áudio em português." }] },
                    });
                    
                    setTranscriptionProgress(90);
                    onTranscriptionComplete(response.text);
                    
                    setTranscriptionProgress(100);
                    setTimeout(() => {
                        setRecordingState('idle');
                        setTranscriptionProgress(0);
                    }, 300);

                } catch (error) {
                    console.error("Transcription failed:", error);
                    let errorMessage = "Erro durante a transcrição.";
                    if (error instanceof Error) {
                        errorMessage += ` Detalhes: ${error.message}`;
                    }
                    onTranscriptionComplete(`[${errorMessage}]`);
                    setRecordingState('idle');
                    setTranscriptionProgress(0);
                }
            };

            recorder.start();
            setRecordingState('recording');
            setElapsedTime(0);
            timerIntervalRef.current = window.setInterval(() => {
                setElapsedTime(prev => {
                    if (prev >= RECORDING_LIMIT_SECONDS - 1) {
                        stopRecording();
                        return RECORDING_LIMIT_SECONDS;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (error) {
            console.error("Erro ao iniciar a gravação:", error);
            setRecordingState('idle');
        }
    }, [recordingState, onTranscriptionComplete, stopRecording, apiKey]);
    
    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopTimer();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if(streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return {
        recordingState,
        startRecording,
        stopRecording,
        elapsedTime,
        transcriptionProgress,
    };
};