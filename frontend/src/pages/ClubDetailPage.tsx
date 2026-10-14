import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

export function ClubDetailPage() {
  const { clubId } = useParams();

  return <PageHeader title={`Clube ${clubId}`} />;
}