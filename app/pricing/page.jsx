'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function Pricing() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const userData = useUser();
      setUser(userData);
    }
    fetchUser();
  }, []);

  // Coin packages with variant IDs from Lemon Squeezy dashboard
  const coinPackages = [
    { name: '100 Coins', variantId: '100d1049-12e3-4a97-b5f1-1c6ab68e676c', price: 9.99 },
    // Add more packages if available, e.g.:
    // { name: '500 Coins', variantId: 'your_variant_id_500', price: 39.99 },
    // { name: '1000 Coins', variantId: 'your_variant_id_1000', price: 69.99 },
  ];

  const createCheckoutLink = (variantId) => {
    const baseUrl = new URL(`https://hidden-wolf.lemonsqueezy.com/buy/${variantId}`);
    if (user) {
      baseUrl.searchParams.append('email', user.emailAddresses[0].emailAddress);
      baseUrl.searchParams.append('name', `${user.firstName} ${user.lastName}`);
      baseUrl.searchParams.append('custom[user_id]', user.id);
    }
    return baseUrl.toString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
      <div className="space-y-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl xl:text-5xl">
            Purchase Coins
          </h1>
        </header>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coinPackages.map((pkg) => (
            <li key={pkg.variantId} className="col-span-1 flex flex-col text-center bg-white rounded-lg shadow divide-y divide-gray-200">
              <div className="flex-1 flex flex-col p-8">
                <h3 className="text-2xl font-medium text-gray-900">{pkg.name}</h3>
                <p className="mt-4 text-base text-gray-500">${pkg.price.toFixed(2)}</p>
              </div>
              <div className="py-4 px-6">
                <a href={createCheckoutLink(pkg.variantId)}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Buy Now
                  </button>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}