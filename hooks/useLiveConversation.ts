
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { GenaiBlob, LiveSession, ConnectionState, Transcription } from '../types';
import { blobToBase64 } from '../utils/fileUtils';

export const useLiveConversation = (
    apiKey: string | null,
    selectedVoice: string,
    systemInstruction: string,
    enableTranscription: boolean,
    onTranscriptionUpdate: (update: { user?: string, assistant?: string }) => void,
    onTurnComplete: (transcription: Transcription) => void,
    onFunctionCall: (name: string, args: any, id: string) => void,
    tools: any[]
) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const isSpeakingRef = useRef(false);
    const frameIntervalRef = useRef<number | null>(null);

    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    const createBlob = (data: Float32Array): GenaiBlob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    const stopAudioPlayback = useCallback(() => {
        audioSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { /* Ignore errors */ }
            source.disconnect();
        });
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        isSpeakingRef.current = false;
        setConnectionState(prev => (prev === ConnectionState.SPEAKING ? ConnectionState.CONNECTED : prev));
    }, []);

    const stopAudioInput = useCallback(() => {
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
    }, []);
    
    const stopConversation = useCallback(() => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        sessionPromiseRef.current?.then(session => session.close()).catch(e => console.error("Error closing session:", e));
        sessionPromiseRef.current = null;
        stopAudioInput();
        stopAudioPlayback();
        setConnectionState(ConnectionState.IDLE);
    }, [stopAudioInput, stopAudioPlayback]);

    const startConversation = useCallback(async (mediaStream: MediaStream, initialContext?: string) => {
        if (!apiKey) {
            console.error("API key is not available.");
            setConnectionState(ConnectionState.ERROR);
            return;
        }
        if (sessionPromiseRef.current) {
            console.warn("Conversation already in progress.");
            return;
        }

        setConnectionState(ConnectionState.CONNECTING);
        try {
            const ai = new GoogleGenAI({ apiKey });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            mediaStreamRef.current = mediaStream;
            
            const config: any = {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
                systemInstruction,
            };
            
            if (tools && tools.length > 0) config.tools = tools;
            if (enableTranscription) {
                config.inputAudioTranscription = {};
                config.outputAudioTranscription = {};
            }

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config,
                callbacks: {
                    onopen: () => {
                        setConnectionState(ConnectionState.CONNECTED);

                        if (initialContext) {
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ text: initialContext });
                            }).catch(e => console.error("Session not ready to send initial context:", e));
                        }
                        
                        const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStream);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (isSpeakingRef.current) {
                                return; // Echo cancellation: do not send audio while assistant is speaking
                            }
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            }).catch(e => console.error("Session not ready to send input:", e));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);

                        // Video stream processing
                        const videoTrack = mediaStream.getVideoTracks()[0];
                        if (videoTrack) {
                            const videoEl = document.createElement('video');
                            videoEl.srcObject = mediaStream;
                            videoEl.muted = true;
                            videoEl.playsInline = true;
                            videoEl.play();

                            const canvasEl = document.createElement('canvas');
                            const ctx = canvasEl.getContext('2d');
                            const FRAME_RATE = 1; // 1 frame per second
                            const JPEG_QUALITY = 0.7;

                            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
                            frameIntervalRef.current = window.setInterval(() => {
                                if (!ctx || videoEl.videoWidth === 0) return;
                                canvasEl.width = videoEl.videoWidth;
                                canvasEl.height = videoEl.videoHeight;
                                ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                                canvasEl.toBlob(
                                    async (blob) => {
                                        if (blob) {
                                            try {
                                                const base64Data = await blobToBase64(blob);
                                                sessionPromiseRef.current?.then((session) => {
                                                    session.sendRealtimeInput({
                                                        media: { data: base64Data, mimeType: 'image/jpeg' }
                                                    });
                                                });
                                            } catch(e) { console.error("Error creating blob for video frame", e); }
                                        }
                                    },
                                    'image/jpeg',
                                    JPEG_QUALITY
                                );
                            }, 1000 / FRAME_RATE);
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const updates: { user?: string; assistant?: string } = {};

                        if (enableTranscription) {
                            if (message.serverContent?.inputTranscription) {
                                currentInputTranscription.current += message.serverContent.inputTranscription.text;
                                updates.user = currentInputTranscription.current;
                            }
                            if (message.serverContent?.outputTranscription) {
                                currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                                updates.assistant = currentOutputTranscription.current;
                            }
                            if (Object.keys(updates).length > 0) {
                                onTranscriptionUpdate(updates);
                            }

                            if (message.serverContent?.turnComplete) {
                                const fullInput = currentInputTranscription.current.trim();
                                const fullOutput = currentOutputTranscription.current.trim();
                                if (fullInput) onTurnComplete({ id: `turn-${Date.now()}-user`, speaker: 'user', text: fullInput, timestamp: Date.now(), isFinal: true });
                                if (fullOutput) onTurnComplete({ id: `turn-${Date.now()}-assistant`, speaker: 'assistant', text: fullOutput, timestamp: Date.now(), isFinal: true });
                                
                                currentInputTranscription.current = '';
                                currentOutputTranscription.current = '';
                                onTranscriptionUpdate({ user: '', assistant: '' });
                            }
                        }

                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                onFunctionCall(fc.name, fc.args, fc.id);
                            }
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            isSpeakingRef.current = true;
                            setConnectionState(ConnectionState.SPEAKING);
                            const outputCtx = outputAudioContextRef.current;
                            const nextStartTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            
                            const sourceNode = outputCtx.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputCtx.destination);
                            
                            sourceNode.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(sourceNode);
                                if (audioSourcesRef.current.size === 0) {
                                    isSpeakingRef.current = false;
                                    setConnectionState(prev => (prev === ConnectionState.SPEAKING ? ConnectionState.CONNECTED : prev));
                                }
                            });
                            
                            sourceNode.start(nextStartTime);
                            nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
                            audioSourcesRef.current.add(sourceNode);
                        }
                        if (message.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live conversation error:', e);
                        setConnectionState(ConnectionState.ERROR);
                        stopConversation();
                    },
                    onclose: () => {
                        // This might be called by stopConversation, so check state to avoid loops
                        if (connectionState !== ConnectionState.IDLE) {
                           stopConversation();
                        }
                    },
                },
            });

        } catch (error) {
            console.error('Failed to start conversation:', error);
            setConnectionState(ConnectionState.ERROR);
            stopAudioInput();
        }
    }, [apiKey, selectedVoice, systemInstruction, enableTranscription, tools, onFunctionCall, onTranscriptionUpdate, onTurnComplete, stopConversation, connectionState]);
    
    const sendToolResponse = useCallback((id: string, name: string, result: any) => {
        sessionPromiseRef.current?.then((session) => {
            session.sendToolResponse({
              functionResponses: { id, name, response: { result } }
            })
        });
    }, []);

    const sendMedia = useCallback((blob: GenaiBlob) => {
        sessionPromiseRef.current?.then((session) => {
            session.sendRealtimeInput({ media: blob });
        });
    }, []);

    const sendText = useCallback((text: string) => {
        sessionPromiseRef.current?.then((session) => {
            session.sendRealtimeInput({ text });
        });
    }, []);

    // Cleanup effect
    useEffect(() => {
        return () => {
           if (sessionPromiseRef.current) {
               stopConversation();
           }
        }
    }, [stopConversation]);

    return { connectionState, startConversation, stopConversation, stopAudioPlayback, sendToolResponse, sendMedia, sendText };
};
