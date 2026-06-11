import { useState, useEffect } from 'react';
import { configApi } from '../services/configApi';

export function useConfig() {
  const [conditionOptions, setConditionOptions] = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [schoolSuggestions, setSchoolSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const [conditions, deliveries, schools, cats] = await Promise.all([
          configApi.getConditionOptions(),
          configApi.getDeliveryOptions(),
          configApi.getSchoolSuggestions(),
          configApi.getCategories(),
        ]);
        
        setConditionOptions(conditions);
        setDeliveryOptions(deliveries);
        setSchoolSuggestions(schools);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load config:', err);
        setError(err);
        // Fallback to empty arrays
        setConditionOptions([]);
        setDeliveryOptions([]);
        setSchoolSuggestions([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return {
    conditionOptions,
    deliveryOptions,
    schoolSuggestions,
    categories,
    loading,
    error,
  };
}