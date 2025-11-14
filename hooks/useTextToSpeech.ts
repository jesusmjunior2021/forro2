import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { TTSState } from '../types';
import { decode, decodeAudioData, findBestVoice } from '../utils/audioUtils';

export const useTextToSpeech = (settings: {
    apiKey: string | null;
    voiceName: string; // Gemini voice
    selectedBrowserVoice: string | null; // Browser voice
    rate: number;
    volume: number;
}) => {
    const [ttsState, setTtsState] = useState<TTSState>({ playingId: null, isPaused: false });
    const [isLoading, setIsLoading] = useState(false);

    // For Gemini TTS
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const startedAtRef = useRef(0);
    const pausedAtRef = useRef(0);

    // For Browser TTS
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
    
    const playingIdRef = useRef<string | null>(null);
    const currentEngine = useRef<'gemini' | 'browser' | null>(null);

    // Initialize both TTS engines
    useEffect(() => {
        // Gemini engine setup
        if (!audioContextRef.current) {
// Fix: Cast window to any to access webkitAudioContext for broader browser support.
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
                gainNodeRef.current = audioContextRef.current.createGain();
                gainNodeRef.current.connect(audioContextRef.current.destination);
            } else {
                console.error("AudioContext not supported by this browser.");
            }
        }

        // Browser engine setup
        const loadVoices = () => {
            setBrowserVoices(window.speechSynthesis.getVoices());
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            // Cleanup for both
            if (sourceNodeRef.current) sourceNodeRef.current.stop();
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.setValueAtTime(settings.volume, audioContextRef.current?.currentTime || 0);
        }
        if (utteranceRef.current) {
            utteranceRef.current.volume = settings.volume;
        }
    }, [settings.volume]);


    const stop = useCallback(() => {
        // Stop Gemini TTS
        if (sourceNodeRef.current) {
            sourceNodeRef.current.onended = null;
            try { sourceNodeRef.current.stop(); } catch (e) { /* already stopped */ }
        }
        // Stop Browser TTS
        window.speechSynthesis.cancel();

        // Reset state for both
        sourceNodeRef.current = null;
        audioBufferRef.current = null;
        utteranceRef.current = null;
        pausedAtRef.current = 0;
        startedAtRef.current = 0;
        playingIdRef.current = null;
        currentEngine.current = null;
        setTtsState({ playingId: null, isPaused: false });
        setIsLoading(false);
    }, []);

    const play = useCallback(async (text: string, id: string, useBrowserTTS: boolean) => {
        stop(); // Stop any currently playing audio
        playingIdRef.current = id;
        setTtsState({ playingId: id, isPaused: false });

        if (useBrowserTTS) {
            currentEngine.current = 'browser';
            const utterance = new SpeechSynthesisUtterance(text);
            const voice = findBestVoice(browserVoices, settings.selectedBrowserVoice);
            if (voice) {
                utterance.voice = voice;
            }
            utterance.rate = settings.rate;
            utterance.volume = settings.volume;
            utterance.lang = 'pt-BR';
            utterance.onend = () => {
                if (playingIdRef.current === id) stop();
            };
            utterance.onerror = (e) => {
                console.error("SpeechSynthesis Error:", e);
                if (playingIdRef.current === id) stop();
            };
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        } else { // Use Gemini TTS
            currentEngine.current = 'gemini';
            if (!settings.apiKey || !audioContextRef.current || !gainNodeRef.current) {
                console.error("Gemini TTS prerequisites not met (API Key or AudioContext).");
                return;
            }
            setIsLoading(true);

            try {
                const ai = new GoogleGenAI({ apiKey: settings.apiKey });
                const prosodyPrompt = `Narrate the following text with human-like prosody. Use natural pauses, vary your intonation, and convey a sense of engagement. If you see onomatopoeias like 'hmm' or 'uhm', pronounce them naturally. The text is: "${text}"`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: prosodyPrompt }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: settings.voiceName || 'Kore' },
                            },
                        },
                    },
                });

                const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!base64Audio) throw new Error("No audio data received from API.");
                if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                audioBufferRef.current = audioBuffer;
                setIsLoading(false);

                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(gainNodeRef.current);
                source.onended = () => {
                    if (playingIdRef.current === id) stop();
                };
                source.start(0);
                startedAtRef.current = audioContextRef.current.currentTime;
                sourceNodeRef.current = source;

            } catch (e) {
                console.error("Error during Gemini TTS playback:", e);
                stop();
            }
        }
    }, [settings.apiKey, settings.voiceName, settings.selectedBrowserVoice, settings.rate, settings.volume, browserVoices, stop]);

    const pause = useCallback(() => {
        if (!ttsState.playingId || ttsState.isPaused) return;
        setTtsState(prev => ({ ...prev, isPaused: true }));
        if (currentEngine.current === 'browser') {
            window.speechSynthesis.pause();
        } else if (currentEngine.current === 'gemini' && sourceNodeRef.current && audioContextRef.current) {
            pausedAtRef.current = audioContextRef.current.currentTime - startedAtRef.current;
            sourceNodeRef.current.onended = null;
            sourceNodeRef.current.stop();
            sourceNodeRef.current = null;
        }
    }, [ttsState.playingId, ttsState.isPaused]);

    const resume = useCallback(() => {
        if (!ttsState.playingId || !ttsState.isPaused) return;
        setTtsState(prev => ({ ...prev, isPaused: false }));
        if (currentEngine.current === 'browser') {
            window.speechSynthesis.resume();
        } else if (currentEngine.current === 'gemini' && audioBufferRef.current && audioContextRef.current && gainNodeRef.current) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBufferRef.current;
            source.connect(gainNodeRef.current);
            source.onended = () => { if (playingIdRef.current === ttsState.playingId) stop(); };
            source.start(0, pausedAtRef.current % audioBufferRef.current.duration);
            startedAtRef.current = audioContextRef.current.currentTime - pausedAtRef.current;
            sourceNodeRef.current = source;
        }
    }, [ttsState.playingId, ttsState.isPaused, stop]);

    return { play, pause, resume, stop, ttsState, isLoading };
};