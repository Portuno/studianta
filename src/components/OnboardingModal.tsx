import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useEffect, useMemo, useState } from 'react'
import { AddProgramModal } from '@/components/AddProgramModal'
import { AddSubjectModal } from '@/components/AddSubjectModal'

interface OnboardingModalProps {
  open: boolean
  onComplete: () => void
}

type StepKey = 1|2|3|4|5|6|7|8|9|10|11|12

const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const { user } = useAuth()
  const [step, setStep] = useState<StepKey>(1)
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [createdProgramId, setCreatedProgramId] = useState<string>('')
  const [showSubjectModal, setShowSubjectModal] = useState(false)

  // Collected fields
  const [studentType, setStudentType] = useState('')
  const [educationLevel, setEducationLevel] = useState('')
  const [country, setCountry] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthCity, setBirthCity] = useState('')

  useEffect(() => {
    if (!open) setStep(1)
  }, [open])

  const userName = useMemo(() => user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'estudiante', [user])

  const persistStep4 = async () => {
    if (!user) return
    await supabase.from('users').update({
      student_type: studentType || null,
      education_level: educationLevel || null,
      country: country || null,
      primary_language: primaryLanguage || null,
    }).eq('id', user.id)
  }

  const persistStep5 = async () => {
    if (!user) return
    await supabase.from('users').update({
      birth_date: birthDate || null,
      birth_time: birthTime || null,
      birth_city: birthCity || null,
    }).eq('id', user.id)
  }

  const handleNext = async () => {
    if (step === 4) await persistStep4()
    if (step === 5) await persistStep5()
    if (step === 7) {
      setShowProgramModal(true)
      return
    }
    if (step === 8) {
      if (!createdProgramId) return
      setShowSubjectModal(true)
      return
    }
    const nextMap: Record<StepKey, StepKey> = {1:2,2:3,3:4,4:5,5:6,6:7,7:8,8:9,9:10,10:11,11:12,12:12}
    setStep(nextMap[step])
  }

  const handleBack = () => {
    const prevMap: Record<StepKey, StepKey> = {1:1,2:1,3:2,4:3,5:4,6:5,7:6,8:7,9:8,10:9,11:10,12:11}
    setStep(prevMap[step])
  }

  const handleProgramCreated = () => {
    setShowProgramModal(false)
    // Library page manages refresh; here just continue
    setStep(8)
  }

  const handleSubjectCreated = () => {
    setShowSubjectModal(false)
    setStep(9)
  }

  const handleFinish = async () => {
    await onComplete()
  }

  const ActionButton = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <Button type="button" onClick={onClick} className="w-full" disabled={disabled}>{label}</Button>
  )

  return (
    <Dialog open={open} modal={!showProgramModal && !showSubjectModal}>
      <DialogContent
        aria-label="Onboarding"
        aria-describedby="onboarding-description"
        overlayClassName="backdrop-blur-sm"
        className="
          left-0 top-0 translate-x-0 translate-y-0 h-[100dvh] w-[100vw] rounded-none overflow-hidden
          grid grid-rows-[auto,1fr,auto]
          p-6
          sm:left-1/2 sm:top-1/2 sm:translate-x-[-50%] sm:translate-y-[-50%]
          sm:h-auto sm:w-full sm:max-w-3xl sm:rounded-lg
          z-50
        "
      >
        <DialogHeader>
          <DialogTitle>Onboard</DialogTitle>
          <DialogDescription id="onboarding-description">
            Flujo inicial para personalizar tu experiencia.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="py-4 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">¡Hola, {userName}! 👋</h3>
              <p>Bienvenido a Studiant, tu asistente de estudio inteligente.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">El problema</h3>
              <p>El estudio tradicional es complicado y abrumador. Demasiadas notas, poco tiempo y sin un plan claro. 🤯</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">La solución</h3>
              <p>Nosotros te ayudamos a estudiar de forma más inteligente. Dejamos que la IA se encargue del trabajo pesado mientras tú te enfocas en aprender.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cuéntanos sobre ti</h3>
              <p>Para darte la mejor experiencia, cuéntanos un poco sobre ti.</p>
              <div className="grid gap-3">
                <label className="text-sm">Tipo de estudiante</label>
                <input aria-label="Tipo de estudiante" className="border rounded-md p-2" placeholder="Universidad, Bachillerato, etc." value={studentType} onChange={(e) => setStudentType(e.target.value)} />
                <label className="text-sm">Nivel de estudios</label>
                <input aria-label="Nivel de estudios" className="border rounded-md p-2" placeholder="Licenciatura, Secundaria, etc." value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} />
                <label className="text-sm">País o región</label>
                <input aria-label="País o región" className="border rounded-md p-2" placeholder="Argentina, México, España..." value={country} onChange={(e) => setCountry(e.target.value)} />
                <label className="text-sm">Idioma principal</label>
                <input aria-label="Idioma principal" className="border rounded-md p-2" placeholder="Español, Inglés..." value={primaryLanguage} onChange={(e) => setPrimaryLanguage(e.target.value)} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Perfil Astrológico</h3>
              <p>Para desbloquear tu perfil de aprendizaje astrológico, dinos tu fecha y hora de nacimiento. 🌌 (Opcional y con novedades futuras)</p>
              <div className="grid gap-3">
                <label className="text-sm">Fecha de nacimiento</label>
                <input aria-label="Fecha de nacimiento" type="date" className="border rounded-md p-2" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                <label className="text-sm">Hora de nacimiento (opcional)</label>
                <input aria-label="Hora de nacimiento" type="time" className="border rounded-md p-2" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
                <label className="text-sm">Ciudad de nacimiento</label>
                <input aria-label="Ciudad de nacimiento" className="border rounded-md p-2" placeholder="Ciudad, País" value={birthCity} onChange={(e) => setBirthCity(e.target.value)} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tu Biblioteca</h3>
              <p>Todo empieza en tu Biblioteca. Es tu espacio personal para organizar y gestionar todos tus apuntes, PDFs y archivos.</p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Crea tu primera carrera</h3>
              <p>Vamos a crear tu primera carrera. Esto servirá como la base de tu espacio de estudio.</p>
              <p className="text-sm text-muted-foreground">Al continuar se abrirá el modal de "Agregar Programa".</p>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Añade tu primera materia</h3>
              <p>Ahora, añade tu primera materia. Esto ayudará a la IA a crear un plan de estudio más preciso.</p>
              <p className="text-sm text-muted-foreground">Al continuar se abrirá el modal de "Agregar Materia".</p>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Magia de la IA</h3>
              <p>¡Increíble! Nuestra IA ha analizado tu materia y ha creado un plan de estudio personalizado solo para ti. ✨</p>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tu Agenda</h3>
              <p>Tu Agenda es tu guía diaria. Aquí verás qué estudiar hoy y podrás iniciar tu sesión en un solo clic.</p>
            </div>
          )}

          {step === 11 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Chat IA</h3>
              <p>Conoce a tu asistente personal de IA. Pregúntale sobre cualquier cosa o vincúlalo a un documento para obtener respuestas específicas de tus apuntes. 💬</p>
            </div>
          )}

          {step === 12 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">¡Todo listo!</h3>
              <p>¡Felicidades, tu espacio de estudio está listo! Ahora es momento de empezar a estudiar de forma más inteligente. 🚀</p>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 left-0 right-0 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-0 pt-2">
          <div className="flex gap-2 w-full">
            {step > 1 && (
              <Button type="button" variant="outline" className="w-1/3" onClick={handleBack}>
                Atrás
              </Button>
            )}
            {step < 12 && (
              <Button type="button" onClick={handleNext} className={`${step > 1 ? 'w-2/3' : 'w-full'}`} disabled={step === 8 && !createdProgramId}>
                {step === 1 ? 'Empezar' : 'Siguiente'}
              </Button>
            )}
            {step === 12 && (
              <Button type="button" onClick={handleFinish} className="w-full">
                Ir a mi Agenda
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {/* External modals triggered by steps 7 and 8 */}
      {showProgramModal && (
        <div className="relative z-[60]">
          <AddProgramModal
            isOpen={showProgramModal}
            onClose={() => {
              setShowProgramModal(false)
            }}
            onProgramCreated={() => {
              // legacy
            }}
            onProgramCreatedWithId={(id) => {
              setCreatedProgramId(id)
              handleProgramCreated()
            }}
          />
        </div>
      )}

      {showSubjectModal && (
        <div className="relative z-[60]">
          <AddSubjectModal
            isOpen={showSubjectModal}
            onClose={() => {
              setShowSubjectModal(false)
            }}
            onSubjectCreated={handleSubjectCreated}
            programId={createdProgramId}
          />
        </div>
      )}
    </Dialog>
  )
}

export default OnboardingModal 