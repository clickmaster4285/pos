import { motion } from 'framer-motion';
import { Building2, Sparkles } from 'lucide-react';

export default function RegisterLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-10 w-80 h-80 bg-linear-to-r from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 3 }}
          className="absolute bottom-10 right-10 w-96 h-96 bg-linear-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-6xl relative z-10"
      >
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div
            whileHover={{ scale: 1.05, rotateY: 180 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-linear-to-br from-blue-600 via-purple-600 to-cyan-600 shadow-2xl shadow-blue-500/40 mb-6 relative"
          >
            <Building2 className="w-10 h-10 text-white" />
            <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-2 -right-2" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold bg-linear-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4"
          >
            Create Your Account
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 text-lg"
          >
            Join thousands of businesses using our platform
          </motion.p>
        </motion.div>

        {children}
      </motion.div>
    </div>
  );
}
