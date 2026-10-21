"""Reproducible offline separation with provenance; never used by the score renderer."""
import argparse
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import platform
import time

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly


def resample(audio, source_rate, target_rate):
    factor = math.gcd(source_rate, target_rate)
    return resample_poly(audio, target_rate // factor, source_rate // factor, axis=0).astype(np.float32)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--method", choices=["demucs", "hpss"], default="demucs")
    parser.add_argument("--threads", type=int, default=4)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    audio, rate = sf.read(args.input, always_2d=True, dtype="float32")
    if not len(audio) or len(audio) / rate > 120 or not np.isfinite(audio).all():
        raise ValueError("Use finite audio of at most 120 seconds")
    if audio.shape[1] > 2:
        raise ValueError("Use mono or stereo audio")
    begin = time.perf_counter()
    report = {
        "pipeline_version": "tonescript-separation-v1",
        "method": args.method, "input": args.input.name,
        "input_sha256": hashlib.sha256(args.input.read_bytes()).hexdigest(),
        "input_sample_rate": rate, "duration_seconds": len(audio) / rate,
        "platform": platform.platform(), "python": platform.python_version(),
        "versions": {p: importlib.metadata.version(p) for p in ["numpy", "scipy", "soundfile", "librosa", "demucs", "torch", "torchaudio"]},
        "listening_review": "pending", "normalization": "no per-stem peak normalization; float WAV retains raw levels",
    }
    if args.method == "hpss":
        import librosa
        mono = audio.mean(axis=1)
        spectrum = librosa.stft(mono, n_fft=2048, hop_length=512)
        harmonic, percussive = librosa.decompose.hpss(spectrum, kernel_size=31, power=2, margin=1)
        stems = {name: librosa.istft(spec, hop_length=512, length=len(mono))[:, None]
                 for name, spec in [("harmonic", harmonic), ("percussive", percussive)]}
        mixture = mono[:, None]
        report["parameters"] = {"n_fft": 2048, "hop_length": 512, "kernel_size": 31, "power": 2, "margin": 1}
        report["interpretation"] = "Harmonic/percussive decomposition, NOT instrument identification."
    else:
        import torch
        from demucs.apply import apply_model
        from demucs.pretrained import get_model
        torch.set_num_threads(max(1, min(8, args.threads)))
        torch.manual_seed(42)
        model_dir = Path(__file__).resolve().parents[1] / "models" / "hub"
        torch.hub.set_dir(str(model_dir))
        # Official Demucs registry verifies its published checksum on download.
        model = get_model("htdemucs")
        model.cpu().eval()
        original_rate = rate
        rate = model.samplerate
        mixture = resample(audio, original_rate, rate)
        if mixture.shape[1] == 1:
            mixture = np.repeat(mixture, 2, axis=1)
        tensor = torch.from_numpy(mixture.T.copy())
        ref = tensor.mean(0)
        mean, std = ref.mean(), ref.std()
        if std < 1e-8:
            raise ValueError("Input is silent; source separation is unnecessary")
        normalized = (tensor - mean) / std
        with torch.inference_mode():
            estimates = apply_model(model, normalized[None], device="cpu", shifts=0,
                                    split=True, overlap=.25, progress=True, num_workers=0)[0]
        # Match Demucs's reconstruction convention without independent stem rescaling.
        estimates = estimates * std + mean
        stems = {name: estimates[i].cpu().numpy().T for i, name in enumerate(model.sources)}
        report["parameters"] = {"model": "htdemucs", "device": "cpu", "threads": torch.get_num_threads(), "shifts": 0, "overlap": .25, "seed": 42}
        signatures = set(getattr(model, "signatures", []))
        report["weights"] = [{"filename": p.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
                             for p in sorted((model_dir / "checkpoints").glob("*.th"))
                             if not signatures or p.name.split("-")[0] in signatures]
        report["interpretation"] = "Estimated drums/bass/other/vocals. A named output does not prove that source is present."
    report["output_sample_rate"] = rate
    report["stems"] = []
    for name, samples in stems.items():
        sf.write(args.output / f"{name}.wav", samples, rate, subtype="FLOAT")
        mono = samples.mean(axis=1)
        analysis = resample(mono, rate, 22050) if rate != 22050 else mono
        # Float output avoids clipping; JS decoder supports IEEE float32 WAV.
        sf.write(args.output / f"{name}-22050.wav", analysis, 22050, subtype="FLOAT")
        report["stems"].append({"name": name, "rms": float(np.sqrt(np.mean(samples ** 2))),
                                "peak": float(np.max(np.abs(samples))), "samples": len(samples)})
    reconstruction = sum(stems.values())
    report["sum_residual_rms"] = float(np.sqrt(np.mean((mixture - reconstruction) ** 2)))
    report["elapsed_seconds"] = time.perf_counter() - begin
    (args.output / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
