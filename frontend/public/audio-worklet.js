/**
 * AudioWorklet processor for mic capture.
 * Runs in a dedicated audio thread; sends Float32 samples to the main thread.
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Accumulate ~256ms worth of samples (4096 at 16kHz) before sending
    this._bufferSize = 4096;
    this._buffer = new Float32Array(this._bufferSize);
    this._writeIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0]; // Float32Array of 128 samples per render quantum

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._writeIndex++] = channel[i];

      if (this._writeIndex >= this._bufferSize) {
        // Transfer the buffer to main thread (zero-copy)
        const transfer = this._buffer;
        this.port.postMessage({ type: "audio", samples: transfer }, [transfer.buffer]);
        // Allocate a fresh buffer
        this._buffer = new Float32Array(this._bufferSize);
        this._writeIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
