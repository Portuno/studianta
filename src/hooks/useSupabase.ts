import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Tables, Inserts, Updates } from '@/lib/supabase'

// Hook para sesiones de estudio
export const useStudySessions = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Tables<'study_sessions'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSessions = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  const addSession = async (session: Omit<Inserts<'study_sessions'>, 'user_id'>) => {
    if (!user) return { error: 'No user logged in' }
    
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert([{ ...session, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setSessions(prev => [data, ...prev])
      return { data, error: null }
    } catch (error) {
      console.error('Error adding session:', error)
      return { error }
    }
  }

  const updateSession = async (id: string, updates: Updates<'study_sessions'>) => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setSessions(prev => prev.map(s => s.id === id ? data : s))
      return { data, error: null }
    } catch (error) {
      console.error('Error updating session:', error)
      return { error }
    }
  }

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSessions(prev => prev.filter(s => s.id !== id))
      return { error: null }
    } catch (error) {
      console.error('Error deleting session:', error)
      return { error }
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [user])

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    addSession,
    updateSession,
    deleteSession,
  }
}

// Hook for programs (top-level entity)
export const usePrograms = () => {
  const { user } = useAuth()
  const [programs, setPrograms] = useState<Tables<'programs'>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchPrograms = async () => {
    if (!user) return
    const now = Date.now()
    if (now - lastFetch < 1000) return

    try {
      setLoading(true)
      setError(null)
      setLastFetch(now)

      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      setError(error as Error)
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProgram = async (programData: {
    name: string
    institution?: string | null
    color?: string | null
    icon?: string | null
    syllabus_file_path?: string | null
    syllabus_file_name?: string | null
    syllabus_file_size?: number | null
  }) => {
    if (!user) return { data: null, error: new Error('No user logged in') }

    try {
      const { data, error } = await supabase
        .from('programs')
        .insert({
          user_id: user.id,
          ...programData,
        })
        .select()
        .single()

      if (error) throw error
      await fetchPrograms()
      return { data, error: null }
    } catch (error) {
      console.error('Error adding program:', error)
      return { data: null, error: error as Error }
    }
  }

  const updateProgram = async (id: string, updates: Partial<Tables<'programs'>>) => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await fetchPrograms()
      return { data, error: null }
    } catch (error) {
      console.error('Error updating program:', error)
      return { data: null, error: error as Error }
    }
  }

  const deleteProgram = async (id: string) => {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchPrograms()
      return { error: null }
    } catch (error) {
      console.error('Error deleting program:', error)
      return { error }
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [user])

  return { programs, loading, error, fetchPrograms, addProgram, updateProgram, deleteProgram }
}

// Hook for subjects (courses within programs)
export const useSubjects = () => {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Tables<'subjects'>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchSubjects = async (programId?: string) => {
    if (!user) return
    const now = Date.now()
    if (now - lastFetch < 1000) return // Throttle
    
    try {
      setLoading(true)
      setError(null)
      setLastFetch(now)
      
      let query = supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
       
      // Require a programId to fetch subjects
      if (!programId) {
        setSubjects([])
        setLoading(false)
        return
      }
      query = query.eq('program_id', programId)
      
      const { data, error } = await query
      
      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      setError(error as Error)
      console.error('Error fetching subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSubject = async (subjectData: {
    name: string
    program_id: string
    syllabus_file_path?: string
    syllabus_file_name?: string
    syllabus_file_size?: number
    instructor_name?: string
    start_date?: string
    end_date?: string
  }) => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          user_id: user.id,
          ...subjectData
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Refresh subjects list under the given program
      await fetchSubjects(subjectData.program_id)
      
      return data
    } catch (error) {
      setError(error as Error)
      console.error('Error adding subject:', error)
      return null
    }
  }

  const updateSubject = async (id: string, updates: Partial<Tables<'subjects'>>) => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      
      // Refresh subjects list
      await fetchSubjects()
      
      return data
    } catch (error) {
      setError(error as Error)
      console.error('Error updating subject:', error)
      return null
    }
  }

  const deleteSubject = async (id: string) => {
    if (!user) return false
    
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Refresh subjects list
      await fetchSubjects()
      
      return true
    } catch (error) {
      setError(error as Error)
      console.error('Error deleting subject:', error)
      return false
    }
  }

  return { 
    subjects, 
    loading, 
    error, 
    fetchSubjects, 
    addSubject, 
    updateSubject, 
    deleteSubject 
  }
}

// Hook para topics - REMOVIDO: La funcionalidad de topics fue eliminada
// export const useTopics = () => {
//   // ... código removido
// }

// Hook para materiales de estudio
export const useStudyMaterials = () => {
  const { user } = useAuth()
  const [materials, setMaterials] = useState<Tables<'study_materials'>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchMaterials = async (subjectId?: string) => {
    if (!user) return
    
    // Prevent multiple rapid fetches
    const now = Date.now()
    if (now - lastFetch < 1000) return // Wait at least 1 second between fetches
    
    try {
      setLoading(true)
      setError(null)
      setLastFetch(now)
      
      let query = supabase
        .from('study_materials')
        .select(`
          *,
          subjects:subject_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (subjectId) {
        query = query.eq('subject_id', subjectId)
      }

      const { data, error } = await query
      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
      setError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  const addMaterial = async (material: Omit<Inserts<'study_materials'>, 'user_id'>) => {
    if (!user) return { error: 'No user logged in' }
    
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .insert([{ ...material, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setMaterials(prev => [data, ...prev])
      return { data, error: null }
    } catch (error) {
      console.error('Error adding material:', error)
      return { error }
    }
  }

  // Don't auto-fetch materials
  useEffect(() => {
    // Materials will be fetched manually when needed
  }, [])

  return {
    materials,
    loading,
    error,
    fetchMaterials,
    addMaterial,
  }
}

// Hook para metas semanales
export const useWeeklyGoals = () => {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Tables<'weekly_goals'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGoals = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('weekly_goals')
        .select(`
          *,
          subjects:subject_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
      setError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  const addGoal = async (goal: Omit<Inserts<'weekly_goals'>, 'user_id'>) => {
    if (!user) return { error: 'No user logged in' }
    
    try {
      const { data, error } = await supabase
        .from('weekly_goals')
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setGoals(prev => [...prev, data])
      return { data, error: null }
    } catch (error) {
      console.error('Error adding goal:', error)
      return { error }
    }
  }

  const updateGoal = async (id: string, updates: Updates<'weekly_goals'>) => {
    try {
      const { data, error } = await supabase
        .from('weekly_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setGoals(prev => prev.map(g => g.id === id ? data : g))
      return { data, error: null }
    } catch (error) {
      console.error('Error updating goal:', error)
      return { error }
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [user])

  return {
    goals,
    loading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
  }
} 