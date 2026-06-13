import { createTenant } from '@/app/actions/tenants';
import { TenantForm } from '@/components/tenants/TenantForm';

export default function NewTenantPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Add Tenant</h1>
      <TenantForm action={createTenant} />
    </div>
  );
}
