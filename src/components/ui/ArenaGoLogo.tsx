import { useTheme } from '../../context/ThemeContext'
import arenaGoIconB from '../../assets/ArenaGoIconB.png'
import arenaGoIconW from '../../assets/ArenaGoIconW.png'

interface ArenaGoLogoProps {
  showText?: boolean
  iconSize?: string
  textSize?: string
  className?: string
}

export function ArenaGoLogo({
  showText = true,
  iconSize = 'h-10 w-10',
  textSize = 'text-2xl',
  className = '',
}: ArenaGoLogoProps) {
  const { theme } = useTheme()
  const src = theme === 'dark' ? arenaGoIconB : arenaGoIconW

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={src} alt="ArenaGo" className={`${iconSize} rounded-full object-cover shrink-0`} />
      {showText && (
        <span className={`font-display ${textSize} tracking-wide leading-none`}>
          <span className="text-chalk">ARENA</span>
          <span className="text-lime">GO</span>
        </span>
      )}
    </div>
  )
}
