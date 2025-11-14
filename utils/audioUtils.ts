export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function findBestVoice(voices: SpeechSynthesisVoice[], selectedVoiceName: string | null): SpeechSynthesisVoice | undefined {
    const ptVoices = voices.filter(v => v.lang.startsWith('pt-BR'));
    if (ptVoices.length === 0) return undefined;

    let finalVoice: SpeechSynthesisVoice | undefined;

    // 1. Try to find the user's selected voice first.
    if (selectedVoiceName) {
        finalVoice = ptVoices.find(v => v.name === selectedVoiceName);
    }

    // 2. If not found, or none selected, try to find a high-quality voice using a priority list.
    if (!finalVoice) {
        const voicePreferences = [
            (v: SpeechSynthesisVoice) => v.name.includes('Francisca'), // Edge
            (v: SpeechSynthesisVoice) => v.name.includes('Antônio'),   // Edge
            (v: SpeechSynthesisVoice) => v.name.includes('Talita'),    // Edge Bilíngue
            (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('português'), // Chrome
            (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('microsoft'), // Other Microsoft voices
            (v: SpeechSynthesisVoice) => v.default, // Browser default for pt-BR
        ];

        for (const check of voicePreferences) {
            const found = ptVoices.find(check);
            if (found) {
                finalVoice = found;
                break;
            }
        }

        // 3. Final fallback to the first available pt-BR voice.
        if (!finalVoice) {
            finalVoice = ptVoices[0];
        }
    }

    return finalVoice;
}