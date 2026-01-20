// DetailsStep.jsx
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Building2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DetailsStep({
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  error,
  isLoading,
  onSubmit,
  readOnlyGoogle = false,
}) {
  return (
    <motion.form
      key="step-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onSubmit={onSubmit}
      className="space-y-8"
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50/80 backdrop-blur-sm"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" /> Company Details
          </h3>
          <InputField
            label="Company Name"
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
            required
            disabled={isLoading}
          />
          <InputField
            label="Company Email"
            type="email"
            value={formData.companyEmail}
            onChange={(e) =>
              setFormData({ ...formData, companyEmail: e.target.value })
            }
            required
            disabled={isLoading}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" /> Admin Details
          </h3>
          <InputField
            label="Admin Name"
            value={formData.adminName}
            onChange={(e) =>
              setFormData({ ...formData, adminName: e.target.value })
            }
            required
            disabled={isLoading}
          />

          <InputField
            label="Admin Email"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => {
              if (readOnlyGoogle === false) {
                setFormData({ ...formData, adminEmail: e.target.value });
              } else {
                undefined
              }
            }}
            required
            disabled={isLoading || readOnlyGoogle}
            readOnly={readOnlyGoogle}
          />
        </motion.div>
      </div>

      {/* {!readOnlyGoogle && ( */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <PasswordField
          label="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          show={showPassword}
          setShow={setShowPassword}
          disabled={isLoading}
        />
        <PasswordField
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          show={showConfirmPassword}
          setShow={setShowConfirmPassword}
          disabled={isLoading}
        />
      </motion.div>
      {/* )} */}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full h-14 font-bold text-lg bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/25 transition-all duration-200 rounded-xl text-white relative overflow-hidden group"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin inline mr-3" />
            Creating Account...
          </>
        ) : (
          <>
            Create Account
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </>
        )}
      </motion.button>
    </motion.form>
  );
}

function InputField({ label, type = "text", ...props }) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <motion.input
        whileFocus={{ scale: 1.02 }}
        type={type}
        className={`w-full h-12 px-4 bg-white/50 border border-gray-200 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 ${props.readOnly ? "bg-gray-50 text-gray-600 cursor-not-allowed" : ""
          }`}
        {...props}
      />
    </div>
  );
}

function PasswordField({ label, show, setShow, ...props }) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type={show ? "text" : "password"}
          className="w-full h-12 px-4 pr-12 bg-white/50 border border-gray-200 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          {...props}
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  );
}
