// src/components/company/UnverifiedCompanies.jsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Building2, Mail, Calendar } from 'lucide-react';

export function UnverifiedCompanies({
  unverifiedCompanie = [],
  onDetail,
  handleVerify,
  isVerifying,
}) {
  const unverifiedCompanies = unverifiedCompanie;
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

  if (!unverifiedCompanies.length) {
    return (
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span>Unverified Companies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              All caught up!
            </h3>
            <p className="text-sm text-muted-foreground">
              There are no pending company verifications.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <span>Unverified Companies</span>
          <Badge variant="default" className="ml-auto">
            {unverifiedCompanies.length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {unverifiedCompanies.map((c) => (
          <div
            key={c.id}
            className="border border-border/50 rounded-xl p-5 space-y-4 hover:border-border/80 transition-colors cursor-pointer"
            onClick={() => onDetail(c)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {c?.name || 'Unnamed Company'}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      <span>{c?.contactEmail || 'No email provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Applied {fmtDate(c?.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Industry: {c?.industry || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleVerify(c.id, 'reject'); }}
                  disabled={isVerifying}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleVerify(c.id, 'approve'); }}
                  disabled={isVerifying}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}