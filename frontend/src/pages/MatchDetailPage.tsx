import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

export function MatchDetailPage() {
  const { matchId } = useParams();

  return <PageHeader title={`Partida ${matchId}`} />;
}