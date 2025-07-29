'use client';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Coins, Gem, Crown, CheckCircle } from 'lucide-react'; // Assuming you use lucide-react for icons

// A reusable card component for a cleaner structure
const PricingCard = ({ pkg, user, isFeatured }) => {
  const createCheckoutLink = (variantId) => {
    const baseUrl = new URL(`https://hidden-wolf.lemonsqueezy.com/buy/${variantId}`);
    if (user) {
      // Pre-fill user data for a seamless checkout experience
      baseUrl.searchParams.append('checkout[email]', user.primaryEmailAddress.emailAddress);
      baseUrl.searchParams.append('checkout[name]', user.fullName);
      baseUrl.searchParams.append('checkout[custom][user_id]', user.id);
    }
    return baseUrl.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -10, scale: 1.03 }}
      className={`relative flex flex-col h-full p-8 rounded-2xl border-2 transition-all duration-300 ${
        isFeatured
          ? 'bg-slate-800/80 border-purple-500 shadow-2xl shadow-purple-500/10'
          : 'bg-slate-800/50 border-slate-700'
      }`}
    >
      {isFeatured && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <div className="px-4 py-1 text-sm font-semibold text-white bg-purple-600 rounded-full shadow-md">
            Best Value
          </div>
        </div>
      )}

      <div className="flex-1">
        <div className="text-center">
          <div className="inline-block p-4 bg-slate-700/50 rounded-xl mb-6">
            <pkg.icon className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white">{pkg.name}</h3>
          <p className="mt-4 flex items-baseline justify-center gap-x-2">
            <span className="text-5xl font-bold tracking-tight text-white">${pkg.price}</span>
            <span className="text-lg font-semibold text-slate-400">USD</span>
          </p>
        </div>

        {/* Features List */}
        <ul role="list" className="mt-8 space-y-4 text-sm leading-6 text-slate-300">
          {pkg.features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <CheckCircle className="h-6 w-5 flex-none text-purple-400" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Call to Action Button */}
      <a
        href={createCheckoutLink(pkg.variantId)}
        className={`block w-full mt-8 px-6 py-4 text-base font-semibold text-center text-white rounded-lg shadow-md transition-transform duration-200 ${
          isFeatured
            ? 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
        }`}
      >
        Purchase Now
      </a>
    </motion.div>
  );
};

export default function PricingPage() {
  // Cleaner way to get user data from Clerk
  const { user, isLoaded } = useUser();

  // Enhanced coin packages with features and icons to "hook" the player
  const coinPackages = [
    {
      name: 'Starter Pack',
      coins: '100',
      price: '0.99',
      variantId: '100d1049-12e3-4a97-b5f1-1c6ab68e676c',
      icon: Coins,
      features: [
        'Perfect for trying out the store.',
        'Get a head start in the game.',
        'One-time purchase.',
      ],
      featured: false,
    },
    {
      name: 'Adventurer Bundle',
      coins: '500',
      price: '4.99',
      variantId: '6cf96237-339d-42dd-80be-69416a3b254b',
      icon: Gem,
      features: [
        'Unlock exclusive player avatars.',
        'Customize your game profile.',
        'Join special game modes.',
        'Great value for dedicated players.',
      ],
      featured: true, // This highlights the card
    },
    {
      name: 'Legendary Chest',
      coins: '1000',
      price: '9.99',
      variantId: 'a0133bd3-7b36-4c31-90a5-6b17c890c748',
      icon: Crown,
      features: [
        'Access to all premium features.',
        'Get the Legendary player frame.',
        'Best price per coin.',
        'Support the game development!',
      ],
      featured: false,
    },
  ];

  if (!isLoaded) {
    // Optional: Add a loading spinner
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white bg-clip-text text-transparent"
          >
            Power Up Your Game
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-slate-400"
          >
            Purchase coins to unlock exclusive content, customize your profile, and enhance your werewolf hunting experience.
          </motion.p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
          {coinPackages.map((pkg) => (
            <PricingCard
              key={pkg.variantId}
              pkg={pkg}
              user={user}
              isFeatured={pkg.featured}
            />
          ))}
        </div>
      </div>
    </div>
  );
}