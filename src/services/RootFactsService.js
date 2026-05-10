import { pipeline, env } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
  }

  // TODO [Basic] Muat model dan inisialisasi pipeline text2text-generation
  // TODO [Advance] Implementasikan strategi Backend Adaptive
  async loadModel() {
    if (navigator.gpu) {
      this.currentBackend = 'webgpu';
    } else {
      this.currentBackend = 'wasm';
    }

    env.allowLocalModels = false;

    this.generator = await pipeline('text2text-generation', 'Xenova/flan-t5-small', {
      device: this.currentBackend,
      progress_callback: (x) => {
        // We can hook to progress if needed
        console.log(x);
      }
    });
    this.isModelLoaded = true;
  }

  // TODO [Advance] Konfigurasi tone fakta yang dihasilkan
  setTone(tone) {
    this.currentTone = tone;
  }

  // TODO [Basic] Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
  // TODO [Skilled] Konfigurasikan parameter generasi berdasarkan kebutuhan
  // TODO [Advance] Implemenasikan parameter tone untuk mengatur nada fakta yang dihasilkan
  async generateFacts(vegetableName) {
    if (!this.generator) return null;

    this.isGenerating = true;

    let promptTone = 'fascinating';
    if (this.currentTone === 'funny') {
      promptTone = 'hilarious and funny';
    } else if (this.currentTone === 'professional') {
      promptTone = 'professional and scientific';
    } else if (this.currentTone === 'casual') {
      promptTone = 'casual and simple';
    }

    const prompt = `Tell me a ${promptTone} fun fact about ${vegetableName}.`;

    try {
      const result = await this.generator(prompt, {
        max_new_tokens: 50,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      });

      this.isGenerating = false;
      return result[0].generated_text;
    } catch (e) {
      this.isGenerating = false;
      console.error(e);
      return `Failed to generate fun fact for ${vegetableName}.`;
    }
  }

  // TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
  isReady() {
    return this.isModelLoaded && !this.isGenerating;
  }
}
