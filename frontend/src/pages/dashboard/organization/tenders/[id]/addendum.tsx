// src/app/dashboard/organization/tenders/tenders/[id]/addendum/page.tsx
// FIX 4: This is the ORGANIZATION addendum page.
// It reuses AddendumPageContent from the shared addendum module but passes
// the organization base path. Previously this file was a broken copy of the
// company page with wrong paths.
'use client';

import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AddendumPageContent } from '@/pages/dashboard/company/tenders/my-tenders/[id]/addendum';

export default function OrganizationAddendumPage() {
    const params = useParams();
    const tenderId = params?.id as string;

    return (
        <DashboardLayout>
            <AddendumPageContent
                tenderId={tenderId}
                basePath="/dashboard/organization/tenders/tenders"
            />
        </DashboardLayout>
    );
}