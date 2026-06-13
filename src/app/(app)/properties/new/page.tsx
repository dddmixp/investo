import { createProperty } from '@/app/actions/properties';
import { PropertyForm } from '@/components/properties/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Add Property</h1>
      <PropertyForm action={createProperty} />
    </div>
  );
}
