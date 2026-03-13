import KanbanBoard from '@/components/kanban/kanban-board';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ContactsKanbanPage() {
  try {
    // Get the contacts board
    const board = await prisma.board.findFirst({
      where: { type: 'contacts' },
    });

    if (!board) {
      return (
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">Quadro de contatos não encontrado</p>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6">
        <KanbanBoard boardId={board.id} boardType="contacts" />
      </div>
    );
  } catch (error) {
    console.error('Erro ao buscar board de contatos:', error);

    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">
          Não foi possível conectar ao banco de dados (contacts board).
          Verifique a configuração de conexão ou tente novamente mais tarde.
        </p>
      </div>
    );
  }
}
