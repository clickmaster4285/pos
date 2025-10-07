'use client';

import React, { useState } from 'react';
import { useGetAllDevicesQuery, useCreateDeviceMutation, useConnectDeviceMutation } from '@/features/attendanceDeviceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Grid, List } from 'lucide-react';

const AttendanceDevices = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceIp: '',
    devicePort: 4370,
    serialNumber: '',
    deviceId: '',
    firmwareVersion: '',
    macAddress: '',
  });

  const { data, isLoading, error } = useGetAllDevicesQuery();
  const [createDevice, { isLoading: isCreating }] = useCreateDeviceMutation();
  const [connectDevice, { isLoading: isConnecting }] = useConnectDeviceMutation();

  const devices = data?.data || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDevice(formData).unwrap();
      setIsFormOpen(false);
      setFormData({
        deviceName: '',
        deviceIp: '',
        devicePort: 4370,
        serialNumber: '',
        deviceId: '',
        firmwareVersion: '',
        macAddress: '',
      });
    } catch (err) {
      console.error(`Failed to create device: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleConnect = async (deviceId) => {
    try {
      await connectDevice(deviceId).unwrap();
    } catch (err) {
      console.error(`Failed to connect: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Attendance Devices</h1>
        <div className="flex items-center space-x-4">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value)}
            className="flex space-x-2"
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <List className="h-5 w-5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Device</span>
          </Button>
        </div>
      </div>

      {/* Add Device Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                name="deviceName"
                value={formData.deviceName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceIp">Device IP</Label>
              <Input
                id="deviceIp"
                name="deviceIp"
                value={formData.deviceIp}
                onChange={handleInputChange}
                required
                pattern="\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devicePort">Device Port</Label>
              <Input
                id="devicePort"
                name="devicePort"
                type="number"
                value={formData.devicePort}
                onChange={handleInputChange}
                required
                min="1"
                max="65535"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <Input
                id="deviceId"
                name="deviceId"
                value={formData.deviceId}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firmwareVersion">Firmware Version (Optional)</Label>
              <Input
                id="firmwareVersion"
                name="firmwareVersion"
                value={formData.firmwareVersion}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="macAddress">MAC Address (Optional)</Label>
              <Input
                id="macAddress"
                name="macAddress"
                value={formData.macAddress}
                onChange={handleInputChange}
                pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Device'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      {error && (
        <p className="text-destructive text-center">
          Error: {error?.message || 'Failed to load devices'}
        </p>
      )}
      {devices.length === 0 && !isLoading && !error && (
        <p className="text-center text-muted-foreground">No devices found.</p>
      )}

      {/* Table View */}
      {viewMode === 'table' && devices.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Name</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device._id}>
                  <TableCell>{device.deviceName}</TableCell>
                  <TableCell>{device.deviceIp}</TableCell>
                  <TableCell>{device.devicePort}</TableCell>
                  <TableCell>{device.serialNumber || 'N/A'}</TableCell>
                  <TableCell>{device.deviceId}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        device.status === 'connected'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {device.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(device._id)}
                      disabled={isConnecting || device.status === 'connected'}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && devices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Card key={device._id}>
              <CardHeader>
                <CardTitle className="text-lg">{device.deviceName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p>{device.deviceIp}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Port</p>
                  <p>{device.devicePort}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p>{device.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Device ID</p>
                  <p>{device.deviceId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      device.status === 'connected'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>
                <Separator className="my-2" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect(device._id)}
                  disabled={isConnecting || device.status === 'connected'}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceDevices;