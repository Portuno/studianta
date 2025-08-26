import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface OnboardingModalProps {
  open: boolean
  onComplete: () => void
}

const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  return (
    <Dialog open={open}>
      <DialogContent aria-label="Onboarding" aria-describedby="onboarding-description">
        <DialogHeader>
          <DialogTitle>Onboard</DialogTitle>
          <DialogDescription id="onboarding-description">
            Bienvenido a Cuaderno. Completa este paso inicial para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Este es el inicio de tu experiencia. Más pasos vendrán luego.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            aria-label="Completar Onboarding"
            onClick={onComplete}
            className="w-full"
          >
            Completar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingModal 