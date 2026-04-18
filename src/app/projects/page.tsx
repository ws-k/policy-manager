import { createClient } from '@/lib/supabase/server'
import { ProjectsClient } from './projects-client'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })

  return <ProjectsClient initialProjects={data ?? []} />
}
