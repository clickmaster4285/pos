import { motion } from 'framer-motion';
import PlanSelection from '@/components/PaymentGateWay/PlanSelection';

export default function PlanStep({ plans, selectedPlan, onPlanSelect, isLoading }) {
  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >

      <PlanSelection
        plans={plans}
        selectedPlan={selectedPlan}
        onPlanSelect={onPlanSelect}
        isLoading={false}
        isChangingPlan={isLoading}
      />
    </motion.div>
  );
}