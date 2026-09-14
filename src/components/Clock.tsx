"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <div className="text-4xl font-semibold tabular-nums">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="text-sm text-neutral-400">
        {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}
