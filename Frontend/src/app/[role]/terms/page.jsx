'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { useGetCompanyQuery } from '@/features/CompanyApi';

export default function TermsPage() {
  const user = useSelector((state) => state.auth.user);
  const { data: companyRes, isLoading, isError } = useGetCompanyQuery();

  const companyName = companyRes?.data?.name || 'Your Company';
  const terms = companyRes?.data?.invoiceSettings?.terms || '';

  const hasTerms = !!terms && terms.trim().length > 0;

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:py-10">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Terms &amp; Conditions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            These terms will appear on your invoices and payment-related
            documents for{' '}
            <span className="font-semibold text-foreground">{companyName}</span>
            .
          </p>
        </div>

        <Link href="/admin/setting" className="shrink-0">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      {/* Content Card */}
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Terms &amp; Conditions of {companyName}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                This text is managed from your company settings and is attached
                to each invoice.
              </p>
            </div>
          </div>

          <div className="px-4 py-4 md:px-6 md:py-6">
            {/* Loading state */}
            {isLoading && (
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            )}

            {/* Error state */}
            {isError && !isLoading && (
              <div className="rounded-md border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Unable to load terms &amp; conditions. Please try again or check
                your company settings.
              </div>
            )}

            {/* Terms text */}
            {!isLoading && !isError && (
              <>
                {hasTerms ? (
                  <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                    {terms}
                  </p>
                ) : (
                  <div className="rounded-md border border-dashed border-muted px-4 py-4 text-sm text-muted-foreground">
                    No terms &amp; conditions have been configured yet.
                    <br />
                    Go to{' '}
                    <span className="font-medium">
                      Settings &gt; Invoice Settings
                    </span>{' '}
                    to add your invoice terms.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
