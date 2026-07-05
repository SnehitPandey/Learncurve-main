import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/users/dashboard');
      // sendSuccess returns { success: true, data: {...} }
      const payload = res?.data ?? res;
      setData(payload);
      setError(null);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return { data, loading, error, refetch: fetchDashboard };
}
