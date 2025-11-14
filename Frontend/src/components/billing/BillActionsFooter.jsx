import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Printer, CreditCard } from 'lucide-react';
import PropTypes from 'prop-types';

function BillActionsFooter({
  onOpenChange,
  onReset,
  setOrderId,
  handleSaveAndPrint,
  handleSave,
  creating,
  itemsLength,
  isBuyerDetailsValid,
}) {
  return (
    <div className="flex gap-3 justify-end pt-4 border-t">
      <Button variant="secondary" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>

      <Button
        variant="secondary"
        onClick={() => {
          if (window.confirm('Are you sure you want to reset all fields?'))
            onReset();
          setOrderId([]);
        }}
      >
        Reset Form
      </Button>

      <Button
        variant="header"
        onClick={handleSaveAndPrint}
        disabled={creating || itemsLength === 0 || !isBuyerDetailsValid}
      >
        {creating ? (
          <Loader className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Printer className="w-4 h-4 mr-2" />
        )}
        Save & Print Receipt
      </Button>

      <div className="relative">
        <Button onClick={handleSave} disabled={creating || itemsLength === 0}>
          {creating && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          <CreditCard className="w-4 h-4 mr-2" />
          Save Bill
        </Button>
      </div>
    </div>
  );
}

BillActionsFooter.propTypes = {
  onOpenChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  setOrderId: PropTypes.func.isRequired,
  handleSaveAndPrint: PropTypes.func.isRequired,
  handleSave: PropTypes.func.isRequired,
  creating: PropTypes.bool.isRequired,
  itemsLength: PropTypes.number.isRequired,
  isBuyerDetailsValid: PropTypes.bool.isRequired,
};

export default BillActionsFooter;
