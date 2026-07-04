import { motion } from "framer-motion";
import { Industries } from "@/utils/industryFields";

export default function IndustryStep({ selectedIndustry, onIndustrySelect }) {
  // 🎨 Map industries to consistent gradient colors
  const gradientMap = {
    Restaurant: "from-orange-400 to-red-500",
    Fashion: "from-pink-400 to-purple-500",
    Pharmacy: "from-teal-400 to-blue-500",
    Electronics: "from-indigo-400 to-cyan-500",
    "General Shop": "from-green-400 to-emerald-500",
    default: "from-gray-400 to-gray-600",
  };

  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
          Select Your Industry
        </h2>
        <p className="text-gray-600 text-lg">
          Choose the industry that best matches your business
        </p>
      </div>

      {/* Industry grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Industries.map((industryName, index) => {
          const id = industryName.toLowerCase().replace(/\s+/g, "-");
          const gradient = gradientMap[industryName] || gradientMap.default;

          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              onClick={() => onIndustrySelect(id, industryName)}
              className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 backdrop-blur-sm ${selectedIndustry === id
                  ? "border-blue-500 bg-linear-to-br from-blue-50 to-purple-50 shadow-lg shadow-blue-500/20"
                  : "border-gray-200 bg-white/80 hover:border-blue-300 hover:shadow-lg"
                }`}
            >
              {/* Gradient circle / icon */}
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-r ${gradient} flex items-center justify-center text-2xl text-white font-bold shadow-md`}
              >
                {industryName.charAt(0)}
              </div>

              {/* Gradient industry text (vibrant and readable) */}
              <p
                className={`font-semibold bg-linear-to-r ${gradient} bg-clip-text text-transparent drop-shadow-sm`}
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {industryName}
              </p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
