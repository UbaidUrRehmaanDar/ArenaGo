import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-turf border-t border-line pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <p className="font-display text-2xl text-lime mb-3">ARENAGO</p>
            <p className="text-[15px] text-mist font-body">
              Book your court. Show up and play.
            </p>
            <p className="text-[13px] text-mist mt-2">Lahore</p>
          </div>
          <div>
            <p className="font-body text-chalk text-sm mb-4">Platform</p>
            <ul className="space-y-2">
              {['Arenas', 'How It Works', 'Pricing', 'For Owners'].map((item) => (
                <li key={item}>
                  <Link to="/arenas" className="text-mist text-[13px] hover:text-chalk">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-body text-chalk text-sm mb-4">Company</p>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <span className="text-mist text-[13px] cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-body text-chalk text-sm mb-4">Sports</p>
            <ul className="space-y-2">
              {['Football', 'Cricket', 'Padel', 'Tennis', 'Basketball', 'Badminton'].map(
                (item) => (
                  <li key={item}>
                    <Link to="/arenas" className="text-mist text-[13px] hover:text-chalk">
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-line">
          <p className="text-mist text-[13px]">
            © 2025 ArenaGo. Made for Pakistan
          </p>
          <div className="flex gap-6">
            {['Twitter', 'Instagram', 'LinkedIn'].map((s) => (
              <span key={s} className="text-mist text-[13px] hover:text-chalk cursor-pointer">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
