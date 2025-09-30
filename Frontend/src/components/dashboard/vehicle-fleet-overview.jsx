import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, MapPin, Fuel, Calendar } from 'lucide-react';

const fleetData = [
  {
    id: 'FL-001',
    model: 'Tesla Model S',
    location: 'Los Angeles, CA',
    status: 'Active',
    mileage: '45,230',
    lastService: '2024-01-15',
    fuelLevel: 85,
  },
  {
    id: 'FL-002',
    model: 'BMW X5',
    location: 'New York, NY',
    status: 'Maintenance',
    mileage: '67,890',
    lastService: '2024-01-10',
    fuelLevel: 42,
  },
  {
    id: 'FL-003',
    model: 'Audi A8',
    location: 'Chicago, IL',
    status: 'Active',
    mileage: '23,456',
    lastService: '2024-01-18',
    fuelLevel: 78,
  },
  {
    id: 'FL-004',
    model: 'Mercedes S-Class',
    location: 'Miami, FL',
    status: 'Service Due',
    mileage: '89,123',
    lastService: '2023-12-20',
    fuelLevel: 91,
  },
];

export function VehicleFleetOverview() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-foreground">
          Fleet Overview
        </CardTitle>
        <Button variant="outline" size="sm">
          View All Vehicles
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fleetData.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {vehicle.id}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground">
                    {vehicle.model}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vehicle.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {vehicle.mileage} mi
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Badge
                    variant={
                      vehicle.status === 'Active'
                        ? 'active'
                        : vehicle.status === 'Maintenance'
                        ? 'pending'
                        : 'reject'
                    }
                    className="mb-1"
                  >
                    {vehicle.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Fuel className="w-3 h-3" />
                    {vehicle.fuelLevel}%
                  </div>
                </div>

                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
