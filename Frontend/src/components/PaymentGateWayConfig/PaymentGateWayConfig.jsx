'use client';

import { useState, useEffect } from 'react';
import { useStripConfigurationMutation } from '@/features/paymentGatewayApi';

export default function StripeConfigPage() {
  const [config, setConfig] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSigningSecret: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stripConfiguration] = useStripConfigurationMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await stripConfiguration(config).unwrap();
      setMessage({ type: 'success', text: response.message || 'Stripe configuration saved successfully!' });
      // Optionally reset form or keep values
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.data?.message || 'Failed to save Stripe configuration. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Example: Make a test API call to Stripe using the secret key
      // This is a placeholder; replace with actual Stripe API call if needed
      const response = await fetch('https://api.stripe.com/v1/charges', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.secretKey}`,
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Stripe connection successful!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to connect to Stripe. Please check your keys.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error testing Stripe connection. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Stripe Configuration</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configure your Stripe API keys to enable payment processing
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {message.text && (
              <div
                className={`p-4 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label htmlFor="publishableKey" className="block text-sm font-medium text-gray-700">
                Publishable Key
              </label>
              <input
                type="text"
                id="publishableKey"
                name="publishableKey"
                value={config.publishableKey}
                onChange={handleInputChange}
                placeholder="pk_test_..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Found in your Stripe dashboard under Developers → API keys
              </p>
            </div>

            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">
                Secret Key
              </label>
              <input
                type="password"
                id="secretKey"
                name="secretKey"
                value={config.secretKey}
                onChange={handleInputChange}
                placeholder="sk_test_..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Keep this secure. Found in your Stripe dashboard under Developers → API keys
              </p>
            </div>

            <div>
              <label htmlFor="webhookSigningSecret" className="block text-sm font-medium text-gray-700">
                Webhook Signing Secret
              </label>
              <input
                type="password"
                id="webhookSigningSecret"
                name="webhookSigningSecret"
                value={config.webhookSigningSecret}
                onChange={handleInputChange}
                placeholder="whsec_..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Found in your Stripe dashboard under Developers → Webhooks
              </p>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={testConnection}
                disabled={isLoading || !config.secretKey}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Need help?</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>
                <a
                  href="https://stripe.com/docs/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Where to find your Stripe API keys
                </a>
              </li>
              <li>
                <a
                  href="https://stripe.com/docs/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Setting up webhooks
                </a>
              </li>
              <li>
                <a
                  href="https://dashboard.stripe.com/test/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Stripe Dashboard (Test Mode)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}