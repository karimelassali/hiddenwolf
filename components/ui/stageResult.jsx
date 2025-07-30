import {
  FaHourglass,
  FaTimes,
  FaGavel,
  FaUsers,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import {
  GiHeartShield,
  GiDeathSkull,
  GiTiedScroll,
} from "react-icons/gi";
import {motion} from "framer-motion";
export default function StageResult ({ result, onClose, type }) {
  const isNight = type === "night";

  const content = {
    night: {
      title: "Dawn Breaks...",
      icon: <FaSun className="text-yellow-400" />,
      scenarios: {
        killed: {
          icon: <GiDeathSkull className="text-red-500" />,
          message: (name) => (
            <>
              <span className="font-bold text-red-400">{name}</span> was killed
              in the night.
            </>
          ),
          description: "The village mourns a loss.",
        },
        saved: {
          icon: <GiHeartShield className="text-green-500" />,
          message: (name) => (
            <>
              <span className="font-bold text-green-400">{name}</span> was
              attacked, but saved!
            </>
          ),
          description: "The doctor's intervention was successful.",
        },
        quiet: {
          icon: <FaMoon className="text-blue-300" />,
          message: () => "The night was eerily quiet.",
          description: "No one was attacked.",
        },
      },
    },
    day: {
      title: "The Verdict Is In...",
      icon: <FaGavel className="text-amber-500" />,
      scenarios: {
        eliminated: {
          icon: <FaGavel className="text-amber-500" />,
          message: (name) => (
            <>
              <span className="font-bold text-amber-400">{name}</span> has been
              voted out.
            </>
          ),
          description: "The village has made its choice.",
        },
        noOneEliminated: {
          icon: <GiTiedScroll className="text-gray-400" />,
          message: () => "The vote was tied.",
          description: "No one was eliminated today.",
        },
      },
    },
  };

  const currentContent = content[type];
  const scenarioKey = Object.keys(result)[0];
  const scenario = currentContent.scenarios[scenarioKey];
  const playerName = result[scenarioKey];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-2xl text-center border border-gray-700 max-w-md w-full"
      >
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 p-3 rounded-full border-4 border-gray-700">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              transition: { repeat: Infinity, duration: 2 },
            }}
          >
            {currentContent.icon}
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-gray-200 mt-8 mb-4">
          {currentContent.title}
        </h2>

        <div className="flex flex-col items-center justify-center gap-4 my-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { delay: 0.2, type: "spring" } }}
            className="text-7xl"
          >
            {scenario.icon}
          </motion.div>
          <p className="text-xl text-gray-300">
            {scenario.message(playerName)}
          </p>
          <p className="text-sm text-gray-500">{scenario.description}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "#6b21a8" }} // purple-700
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg transition-colors"
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
