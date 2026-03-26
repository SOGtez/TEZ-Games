import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children, title = 'TEZ Games' }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="TEZ Games — fun browser-based arcade games for everyone!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 font-nunito">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-3xl font-fredoka font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200 inline-block">
                TEZ Games
              </span>
              <span className="text-2xl animate-float">🎮</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-purple-700 font-semibold hover:text-pink-500 transition-colors duration-200"
              >
                All Games
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="text-center py-8 text-purple-400 font-nunito text-sm">
          <p>Made with ❤️ by TEZ Games · Play, have fun, repeat!</p>
        </footer>
      </div>
    </>
  );
}
