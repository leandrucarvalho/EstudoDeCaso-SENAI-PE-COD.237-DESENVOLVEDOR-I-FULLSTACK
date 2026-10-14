import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Página não encontrada"
        description="O endereço pode estar errado ou a página não existe."
      />
      <Button asChild variant="outline">
        <Link to="/jogadores">Voltar para jogadores</Link>
      </Button>
    </>
  );
}
