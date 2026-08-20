'use client';

import { useState } from 'react';
import { Search, MessageSquare, ChevronDown, ThumbsUp } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Input, Button } from '@tienda/ui';
import type { PDPProduct, ProductQuestion } from '@lib/storefront/types';

type ProductQuestionsProps = {
  product: PDPProduct;
  className?: string;
};

function QuestionCard({ q }: { q: ProductQuestion }) {
  const answered = !!q.answer;

  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{q.author}</span>
            <span className="text-xs text-muted-foreground">{q.date}</span>
          </div>
          <p className="text-sm text-foreground">{q.question}</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className="h-3 w-3" />
          {q.likes}
        </span>
      </div>

      {answered ? (
        <div className="ml-4 pl-3 border-l-2 border-primary/30 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">Tienda</span>
            <span className="text-xs text-muted-foreground">{q.answerDate}</span>
          </div>
          <p className="text-sm text-muted-foreground">{q.answer}</p>
        </div>
      ) : (
        <p className="ml-4 text-xs text-muted-foreground italic">Pendiente de respuesta</p>
      )}
    </div>
  );
}

export function ProductQuestions({ product, className }: ProductQuestionsProps) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = product.questions.filter(
    (q) => q.question.toLowerCase().includes(search.toLowerCase()),
  );
  const displayed = showAll ? filtered : filtered.slice(0, 3);

  if (product.questions.length === 0) return null;

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="questions-heading">
      <h2 id="questions-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        Preguntas y respuestas
        <span className="text-sm font-normal text-muted-foreground">({product.questions.length})</span>
      </h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscá entre las preguntas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Buscar preguntas"
        />
      </div>

      <div className="space-y-3">
        {displayed.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
      </div>

      {filtered.length === 0 && search && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No se encontraron preguntas para &quot;{search}&quot;
        </p>
      )}

      <div className="flex items-center justify-between">
        {filtered.length > 3 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Mostrar menos' : `Ver todas (${filtered.length})`}
          </Button>
        )}
        <Button size="sm">
          Hacé una pregunta
        </Button>
      </div>
    </section>
  );
}
