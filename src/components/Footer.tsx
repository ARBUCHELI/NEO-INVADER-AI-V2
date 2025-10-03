import { Heart, Coffee } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card/30 border-t border-border/50 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 text-sm text-muted-foreground">
        {/* Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="whitespace-nowrap">
            © {currentYear} Andrés R. Bucheli. Made with
          </span>
          <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
          <span className="whitespace-nowrap">and lots of</span>
          <Coffee className="w-4 h-4 text-primary" />
        </div>
      </div>
    </footer>
  )
}

export default Footer
