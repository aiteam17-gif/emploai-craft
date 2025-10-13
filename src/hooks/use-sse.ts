import { useEffect, useRef } from "react";

export function useSSE(url: string, onEvent: (type: string, data: any) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(url, { withCredentials: false });
    eventSourceRef.current = es;

    const handler = (type: string) => (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        onEvent(type, data);
      } catch {
        // ignore parse errors
      }
    };

    es.addEventListener("hello", handler("hello"));
    es.addEventListener("heartbeat", handler("heartbeat"));
    es.addEventListener("run.updated", handler("run.updated"));

    es.onerror = () => {
      // Let browser auto-reconnect; nothing to do
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [url, onEvent]);

  return eventSourceRef;
}


