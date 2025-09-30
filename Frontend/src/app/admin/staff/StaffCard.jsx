'use client';
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, Phone, MapPin, Edit, Shield, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const StaffCard = ({ member, handleEditClick, handleDeleteStaff, getRoleColor, getInitials, permissionLabels }) => {
  return (
    <Card className="shadow-lg backdrop-blur-sm bg-card/80 border border-border/50 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
              <AvatarFallback className={`text-white font-semibold ${getRoleColor(member.subRole)} text-lg`}>
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`text-white font-medium ${getRoleColor(member.subRole)} px-3 py-1`}>
                  {member.subRole}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  {member.department}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-sm border border-border/50">
              <DropdownMenuItem onClick={() => handleEditClick(member)} className="text-foreground hover:bg-primary/10">
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground hover:bg-primary/10">
                <Shield className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteStaff(member._id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Staff
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="mr-2 h-4 w-4 text-primary" />
            {member.email}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="mr-2 h-4 w-4 text-primary" />
            {member.phone || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            {member.address || 'N/A'}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Key Permissions</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(member.permissions)
              .filter(([_, value]) => value)
              .slice(0, 3)
              .map(([key, _]) => (
                <Badge key={key} variant="secondary" className="text-xs bg-primary/10 text-primary">
                  {permissionLabels[key]}
                </Badge>
              ))}
            {Object.values(member.permissions).filter(Boolean).length > 3 && (
              <Badge variant="secondary" className="text-xs bg-muted/50 text-muted-foreground">
                +{Object.values(member.permissions).filter(Boolean).length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffCard;