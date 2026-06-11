"use client";
import { useState } from "react";

export default function GenerateEmbeddingsPage() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [cronSecret, setCronSecret] = useState("");
  const [totalProcessed, setTotalProcessed] = useState(0);

  const addLog = (msg: string) => {
    setLog((prev) => [...prev.slice(-100), msg]);
  };

  const runBatch = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/ai/generate-embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        addLog(`❌ Error: ${data.error}`);
        return false;
      }

      if (data.done && data.processed === 0) {
        addLog("✅ Todos los artículos ya tienen embeddings.");
        return false;
      }

      setTotalProcessed((prev) => prev + (data.processed ?? 0));
      addLog(
        `✅ Procesados: ${data.processed} | Restantes: ${data.remaining}`
      );

      if (data.done) {
        addLog("🎉 ¡Embeddings generados para todos los artículos!");
        return false;
      }

      return true;
    } catch (err) {
      addLog(`❌ Error de conexión: ${String(err)}`);
      return false;
    }
  };

  const startLoop = async () => {
    if (!cronSecret.trim()) {
      alert("Ingresa el CRON_SECRET primero");
      return;
    }

    setRunning(true);
    setDone(false);
    setLog([]);
    setTotalProcessed(0);
    addLog("🚀 Iniciando generación de embeddings...");

    let shouldContinue = true;
    while (shouldContinue) {
      shouldContinue = await runBatch();
      if (shouldContinue) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setRunning(false);
    setDone(true);
  };

  const stop = () => {
    setRunning(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Generar Embeddings</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">CRON_SECRET</label>
        <input
          type="password"
          value={cronSecret}
          onChange={(e) => setCronSecret(e.target.value)}
          placeholder="Ingresa tu CRON_SECRET"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={startLoop}
          disabled={running}
          className="bg-[#1E2A38] text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {running ? "Procesando..." : "Iniciar"}
        </button>
        <button
          onClick={stop}
          disabled={!running}
          className="bg-red-500 text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Detener
        </button>
      </div>

      {totalProcessed > 0 && (
        <p className="text-sm text-gray-600 mb-3">
          Total procesados esta sesión: <strong>{totalProcessed}</strong>
        </p>
      )}

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-green-800 text-sm">
          ¡Proceso completado! Todos los artículos tienen embeddings.
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs text-green-400">
        {log.length === 0 && (
          <p className="text-gray-500">Los logs aparecerán aquí...</p>
        )}
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
