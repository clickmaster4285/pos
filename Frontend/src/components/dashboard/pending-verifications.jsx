'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, User, CreditCard } from 'lucide-react';

import { useGetAllUsersQuery } from '@/features/userApi';
import { useVerifyCompanyAdminMutation } from '@/features/CompanyApi';

export function PendingVerifications() {
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllUsersQuery();

  const [verifyCompanyAdmin] = useVerifyCompanyAdminMutation();

  const fmtPrice = (n) =>
    typeof n === 'number' ? `Rs. ${n.toLocaleString()}/month` : '—';

  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

  const pickPlan = (u) => {
    const planArray =
      u?.plan ||
      u?.company?.plan ||
      u?.organization?.plan ||
      u?.selectedPlan ||
      [];
    const p0 = Array.isArray(planArray) ? planArray[0] : undefined;
    return {
      name: p0?.name ?? '—',
      validateDays: p0?.validateDays ?? '—',
      price: fmtPrice(p0?.price),
    };
  };

  const pendingUsers = (Array.isArray(users) ? users : []).filter(
    (u) => u?.status?.isaccepted !== 'true' && u?.status?.isactive !== 'true'
  );

  const handleVerify = async (id, action) => {
    try {
      await verifyCompanyAdmin({ id, action }).unwrap();
      refetch();
    } catch (e) {
      console.error('Verification error:', e);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Pending Plan Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>Loading…</CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Pending Plan Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">
            Failed to load users:{' '}
            {error?.data?.message || error?.error || 'Unknown error'}
          </div>
          <Button size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground w-full">
          <Clock className="h-5 w-5 text-primary" />
          Pending Plan Verifications
          <Badge variant="default" className="ml-auto">
            {pendingUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {pendingUsers.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No pending plan verifications
          </div>
        ) : (
          pendingUsers.map((u) => {
            const plan = pickPlan(u);

            return (
              <div
                key={u._id}
                className="border border-border/30 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {u?.name || u?.fullName || u?.username || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        {plan.name} — {plan.price}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Applied Date: {fmtDate(u?.createdAt)}
                    </p>
                  </div>

                  <Badge variant="pending">
                    {String(plan.validateDays)}/Days
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleVerify(u._id, 'approve')}
                    variant="success"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleVerify(u._id, 'reject')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}