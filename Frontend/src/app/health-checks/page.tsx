import ComingSoon from '@/components/ComingSoon';
import { Activity } from 'lucide-react';

export default function HealthChecksPage() {
  return (
    <ComingSoon
      title="Health checks"
      description="Health checks monitor the health and performance of your web applications, web servers, and other resources. Route 53 can route traffic away from unhealthy resources automatically."
      icon={<Activity className="w-8 h-8" />}
    />
  );
}
