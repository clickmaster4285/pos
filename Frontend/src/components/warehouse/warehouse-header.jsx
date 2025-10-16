import { Truck } from 'lucide-react';

export default function WarehouseHeader() {
  return (
    <header className=" backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
         
          <div>
            <h1 className="text-3xl font-medium mt-4 text-foreground">
              Warehouse Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Automotive Parts Inventory System
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
