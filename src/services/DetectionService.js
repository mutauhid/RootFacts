import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
  }

  // TODO [Basic] Muat model dan metadata secara bersamaan, lalu simpan ke instance
  // TODO [Advance] Implementasikan strategi Backend Adaptive
  async loadModel() {
    if (navigator.gpu) {
      try {
        await tf.setBackend('webgpu');
        console.log('Using WebGPU backend');
      } catch (e) {
        await tf.setBackend('webgl');
        console.log('Using WebGL backend (fallback)');
      }
    } else {
      await tf.setBackend('webgl');
      console.log('Using WebGL backend');
    }
    await tf.ready();

    const modelURL = '/model/model.json';
    const metadataURL = '/model/metadata.json';

    this.model = await tf.loadLayersModel(modelURL);
    const response = await fetch(metadataURL);
    const metadata = await response.json();

    this.labels = metadata.labels;
    this.config = metadata;
  }

  // TODO [Basic] Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
  async predict(imageElement) {
    if (!this.model) return null;

    const predictionsTensor = tf.tidy(() => {
      let tensor = tf.browser.fromPixels(imageElement);
      const imageSize = this.config?.imageSize || 224;
      tensor = tf.image.resizeBilinear(tensor, [imageSize, imageSize]);

      const offset = tf.scalar(127.5);
      const normalized = tensor.toFloat().sub(offset).div(offset);
      const batched = normalized.expandDims(0);

      return this.model.predict(batched);
    });

    const classProbabilitiesData = await predictionsTensor.data();
    predictionsTensor.dispose();

    const classProbabilities = Array.from(classProbabilitiesData);
    let maxProb = 0;
    let maxIdx = 0;

    for (let i = 0; i < classProbabilities.length; i++) {
      if (classProbabilities[i] > maxProb) {
        maxProb = classProbabilities[i];
        maxIdx = i;
      }
    }

    return {
      label: this.labels[maxIdx],
      confidence: maxProb * 100,
      isValid: true
    };
  }

  // TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
  isLoaded() {
    return this.model !== null;
  }
}
