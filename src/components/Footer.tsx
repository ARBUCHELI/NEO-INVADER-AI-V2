import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Heart, Coffee } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='bg-card/30 border-t border-border/50 backdrop-blur-sm'>
      
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            {/* Copyright */}
            <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
              <span>© {currentYear} Andrés R. Bucheli. Made with</span>
              <Heart className='w-4 h-4 text-red-500 fill-current animate-pulse' />
              <span>and lots of</span>
              <Coffee className='w-4 h-4 text-primary' />
            </div>

           
          
         
     
      </div>
    </footer>
  )
}

export default Footer