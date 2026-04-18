import { createClient } from '@/lib/supabase/server'
import { ProjectsClient } from './projects-client'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const [activeRes, archivedRes] = await Promise.all([
    supabase.from('projects').select('id, name, created_at, archived').eq('archived', false).order('created_at', { ascending: true }),
    supabase.from('projects').select('id, name, created_at, archived').eq('archived', true).order('created_at', { ascending: true }),
  ])

  return (
    <ProjectsClient
      initialProjects={activeRes.data ?? []}
      initialArchived={archivedRes.data ?? []}
    />
  )
}
