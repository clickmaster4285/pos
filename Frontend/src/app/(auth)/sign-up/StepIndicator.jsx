import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex items-center justify-center mb-12"
    >
      <div className="flex items-center space-x-8">
        {steps.map((stepItem, index) => (
          <div key={stepItem.num} className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => currentStep > stepItem.num && onStepClick(stepItem.num)}
              className={`flex items-center gap-4 transition-all duration-300 ${currentStep >= stepItem.num ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
            >
              <motion.div
                className={`flex items-center justify-center w-14 h-14 rounded-2xl font-bold text-lg transition-all duration-300 ${currentStep === stepItem.num
                    ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                    : currentStep > stepItem.num
                      ? 'bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50'
                      : 'bg-gray-200 text-gray-400'
                  }`}
              >
                {currentStep > stepItem.num ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <stepItem.icon className="w-6 h-6" />
                )}
              </motion.div>
              <div className="text-left">
                <p className={`text-sm font-semibold ${currentStep >= stepItem.num ? 'text-gray-900' : 'text-gray-400'}`}>
                  Step {stepItem.num}
                </p>
                <p className={`font-bold ${currentStep >= stepItem.num ? 'text-gray-700' : 'text-gray-400'}`}>
                  {stepItem.label}
                </p>
              </div>
            </motion.button>

            {index < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: currentStep > stepItem.num ? 1 : 0.3 }}
                className={`w-16 h-1 mx-4 rounded-full ${currentStep > stepItem.num
                    ? 'bg-linear-to-r from-green-500 to-emerald-600'
                    : 'bg-gray-200'
                  }`}
              />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
