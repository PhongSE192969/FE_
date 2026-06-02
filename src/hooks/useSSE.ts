// hooks/useSSE.js
import { useEffect, useState, useRef } from 'react';
import ENV from '@/config/env';

type SSEOptions = {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
};

export const useSSE = (endpoint: string, options: SSEOptions = {}) => {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Xây dựng URL đúng
    let fullUrl = endpoint;
    
    if (!endpoint.startsWith('http')) {
      const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
      fullUrl = apiEndpoint;
    }
    
    console.log(`📡 Initializing SSE: ${fullUrl}`);
    
    try {
      const eventSource = new EventSource(fullUrl, { withCredentials: true });

      eventSource.onopen = () => {
        console.log(`✅ SSE connected: ${endpoint}`);
        setIsConnected(true);
      };

      // Hàm xử lý message chung
      const handleMessage = (event: MessageEvent, eventType?: string) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log(`📨 SSE ${eventType || 'message'} received:`, parsedData);
          setData(parsedData);
          options.onMessage?.(parsedData);
        } catch (err) {
          console.error('SSE parse error:', err, event.data);
        }
      };

      // Lắng nghe event chính xác từ BE: 'franchise-update'
      eventSource.addEventListener('franchise-update', (event: MessageEvent) => {
        handleMessage(event, 'franchise-update');
      });

      // Lắng nghe event 'shift-update' (nếu có)
      eventSource.addEventListener('shift-update', (event: MessageEvent) => {
        handleMessage(event, 'shift-update');
      });

      // Lắng nghe event 'report-update' (nếu có)
      eventSource.addEventListener('report-update', (event: MessageEvent) => {
        handleMessage(event, 'report-update');
      });

      // Fallback cho onmessage (nếu BE không gửi event name)
      eventSource.onmessage = (event: MessageEvent) => {
        handleMessage(event, 'onmessage');
      };

      eventSource.onerror = (err) => {
        console.warn(`SSE connection issue: ${endpoint}`, err);
        setIsConnected(false);
        options.onError?.(err);
        // Không close ở đây để browser tự reconnect
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error(`Failed to create SSE connection: ${endpoint}`, error);
    }

    return () => {
      if (eventSourceRef.current) {
        console.log(`🔌 Closing SSE: ${endpoint}`);
        eventSourceRef.current.close();
      }
    };
  }, [endpoint]);

  return { data, isConnected };
};