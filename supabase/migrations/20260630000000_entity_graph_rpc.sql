create or replace function public.get_entity_graph()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with graph_nodes as (
    select
      'idea:' || id::text as id,
      id::text as entity_id,
      'idea' as type,
      title,
      nullif(description, '') as subtitle,
      created_at
    from public.ideas
    where user_id = auth.uid()

    union all

    select
      'project:' || id::text as id,
      id::text as entity_id,
      'project' as type,
      title,
      nullif(main_goal, '') as subtitle,
      created_at
    from public.projects
    where user_id = auth.uid()

    union all

    select
      'goal:' || id::text as id,
      id::text as entity_id,
      'goal' as type,
      title,
      priority as subtitle,
      created_at
    from public.goals
    where user_id = auth.uid()
  ),
  graph_edges as (
    select distinct
      'project_idea:' || pi.project_id::text || ':' || pi.idea_id::text as id,
      'project:' || pi.project_id::text as source,
      'idea:' || pi.idea_id::text as target,
      'project_idea' as type
    from public.project_ideas pi
    inner join public.projects p on p.id = pi.project_id and p.user_id = auth.uid()
    inner join public.ideas i on i.id = pi.idea_id and i.user_id = auth.uid()

    union

    select distinct
      'goal_idea:' || gi.goal_id::text || ':' || gi.idea_id::text as id,
      'goal:' || gi.goal_id::text as source,
      'idea:' || gi.idea_id::text as target,
      'goal_idea' as type
    from public.goal_ideas gi
    inner join public.goals g on g.id = gi.goal_id and g.user_id = auth.uid()
    inner join public.ideas i on i.id = gi.idea_id and i.user_id = auth.uid()

    union

    select distinct
      'goal_project:' || gp.goal_id::text || ':' || gp.project_id::text as id,
      'goal:' || gp.goal_id::text as source,
      'project:' || gp.project_id::text as target,
      'goal_project' as type
    from public.goal_projects gp
    inner join public.goals g on g.id = gp.goal_id and g.user_id = auth.uid()
    inner join public.projects p on p.id = gp.project_id and p.user_id = auth.uid()

    union

    select distinct
      'goal_project_direct:' || g.id::text || ':' || g.project_id::text as id,
      'goal:' || g.id::text as source,
      'project:' || g.project_id::text as target,
      'goal_project' as type
    from public.goals g
    inner join public.projects p on p.id = g.project_id and p.user_id = auth.uid()
    where g.user_id = auth.uid()
      and g.project_id is not null
  )
  select jsonb_build_object(
    'nodes',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'entityId', entity_id,
            'type', type,
            'title', title,
            'subtitle', subtitle,
            'createdAt', created_at
          )
          order by created_at desc
        )
        from graph_nodes
      ),
      '[]'::jsonb
    ),
    'edges',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'source', source,
            'target', target,
            'type', type
          )
          order by id
        )
        from graph_edges
      ),
      '[]'::jsonb
    )
  );
$$;

grant execute on function public.get_entity_graph() to authenticated;
