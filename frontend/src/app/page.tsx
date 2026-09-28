"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Connexion à l'API...");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("API injoignable"));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">BreachMap : {message}</h1>
    </main>
  );
}