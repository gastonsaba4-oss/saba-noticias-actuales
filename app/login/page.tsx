"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Radio } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4EEE0] dark:bg-[#1A1712] text-[#231F1A] dark:text-[#F2EEE4] px-4">
      <div className="w-full max-w-sm border border-[#DDD5C7] dark:border-[#3A362F] bg-[#FEFCF8] dark:bg-[#231F1A] rounded-md p-6">
        <div className="flex items-center gap-2 mb-1">
          <Radio size={20} className="text-[#B3492B] dark:text-[#E38B6F]" />
          <h1 className="font-serif text-xl font-bold">Saba Noticias Actuales</h1>
        </div>
        <p className="text-xs text-[#9A9384] mb-5">
          Ingresá con tu email para guardar favoritos y configurar alertas.
        </p>

        {status === "sent" ? (
          <p className="text-sm">
            Te enviamos un link de acceso a <strong>{email}</strong>. Abrilo desde este mismo
            dispositivo para iniciar sesión.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3 py-2 text-sm rounded-md bg-white dark:bg-[#1A1712] border border-[#DDD5C7] dark:border-[#3A362F] outline-none focus:ring-2 focus:ring-[#C9962E]"
            />
            {status === "error" && <p className="text-xs text-[#B3492B]">{errorMsg}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full py-2 rounded-md bg-[#B3492B] text-[#FBF4EC] text-sm font-medium hover:bg-[#9C3E24] transition-colors disabled:opacity-60"
            >
              {status === "sending" ? "Enviando..." : "Enviar link de acceso"}
            </button>
          </form>
        )}

        <a href="/" className="block text-center text-xs text-[#9A9384] mt-5 hover:underline">
          Volver al dashboard sin ingresar
        </a>
      </div>
    </div>
  );
}
