import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'

interface Props {
  title: string
  phase: number
  text: string
}

/** Pagina provvisoria per le sezioni non ancora sviluppate. */
export function PlaceholderPage({ title, phase, text }: Props) {
  return (
    <>
      <PageHeader title={title} />
      <Card variant="glass">
        <EmptyState title={`In arrivo nella fase ${phase}`} text={text} />
      </Card>
    </>
  )
}
