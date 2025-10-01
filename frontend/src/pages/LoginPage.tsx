import React, { useState, type JSX } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Landing + modal login/register component for a DB diagram editor product
// - Tailwind CSS required
// - Framer Motion for subtle animations
// - Responsive and accessible

export default function LandingLoginPage(): JSX.Element {
  const [isRegistering, setIsRegistering] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);

  // form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering && !email) {
      setError('Email es requerido para registrarse');
      return;
    }

    try {
      let success;
      if (isRegistering) {
        success = await register(username, password, email);
      } else {
        success = await login(username, password);
      }

      if (!success) {
        setError(isRegistering ? 'Error en registro' : 'Credenciales incorrectas');
      } else {
        setOpenAuth(false);
      }
    } catch (err) {
      console.error(err);
      setError('Error de autenticación');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      {/* NAV */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">DB</div>
          <div>
            <span className="block font-semibold">SchemaCraft</span>
            <small className="text-xs text-slate-500">Diagrams → Spring Boot code (auto)</small>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <button
            onClick={() => setOpenAuth(true)}
            className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 shadow"
          >
            Start Free
          </button>
          <button
            onClick={() => setOpenAuth(true)}
            className="text-sm text-slate-600 hover:underline"
          >
            Login
          </button>
        </nav>
      </header>

      {/* HERO */}
      <main className="max-w-7xl mx-auto px-6">
        <section className="max-w-3xl mx-auto py-12">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold leading-tight text-center"
          >
            Diseña tus esquemas de base de datos
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">y exporta código Spring Boot automáticamente</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-6 text-lg text-slate-600 max-w-xl mx-auto text-center"
          >
            SchemaCraft es un editor visual para bases de datos: crea diagramas, valida relaciones, genera migraciones y obtén el código listo para tu proyecto Spring Boot con un clic.
          </motion.p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => { setOpenAuth(true); setIsRegistering(false); }}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg font-medium shadow hover:bg-indigo-700"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setOpenAuth(true); setIsRegistering(true); }}
              className="inline-flex items-center gap-2 border border-slate-200 px-5 py-3 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Crear cuenta gratis
            </button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg shadow p-2 flex items-center justify-center">⚡</div>
              <div>
                <div className="font-medium">Genera código</div>
                <div className="text-xs">Entities, Repositories y Migrations</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg shadow p-2 flex items-center justify-center">🔁</div>
              <div>
                <div className="font-medium">Iteración rápida</div>
                <div className="text-xs">Cambia el diagrama y actualiza el código</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg shadow p-2 flex items-center justify-center">🔒</div>
              <div>
                <div className="font-medium">Export seguro</div>
                <div className="text-xs">Formato listo para CI/CD</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 mt-12 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Editor visual', desc: 'Arrastra, suelta y crea tablas y relaciones con un UX limpio.' },
            { title: 'Export automático', desc: 'Genera Entities, Repos y Migrations listos para tu módulo Spring.' },
            { title: 'Validaciones', desc: 'Chequeos de integridad, llaves y tipos antes de exportar.' },
          ].map((f) => (
            <motion.div key={f.title} whileHover={{ y: -6 }} className="p-6 bg-white rounded-2xl shadow">
              <div className="text-2xl mb-3">✅</div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="mt-10 bg-gradient-to-r from-indigo-50 to-pink-50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold">Listo para acelerar tu desarrollo</div>
            <div className="text-sm text-slate-600">Prueba gratis, importa tus modelos y empieza a generar código hoy mismo.</div>
          </div>
          <div>
            <button onClick={() => { setOpenAuth(true); setIsRegistering(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow">Prueba gratis</button>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-10 text-sm text-slate-500">
        <div className="flex justify-between items-center">
          <div>© {new Date().getFullYear()} SchemaCraft · Built for developers</div>
          <div className="flex gap-4">
            <a className="hover:underline">Privacy</a>
            <a className="hover:underline">Docs</a>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL */}
      {openAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenAuth(false)} />

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
              <button onClick={() => setOpenAuth(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>

            {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Usuario</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full border border-slate-200 rounded-md p-2"
                  required
                />
              </div>

              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-md p-2"
                    type="email"
                    required={isRegistering}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-slate-200 rounded-md p-2"
                  type="password"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input id="remember" type="checkbox" className="w-4 h-4" />
                  <label htmlFor="remember" className="text-sm text-slate-600">Recuérdame</label>
                </div>

                <button type="button" className="text-sm text-indigo-600 hover:underline">Olvidé mi contraseña</button>
              </div>

              <div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md">{isRegistering ? 'Registrarse' : 'Entrar'}</button>
              </div>

              <div className="text-center text-sm text-slate-500">
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="underline">
                  {isRegistering ? '¿Ya tienes cuenta? Entrar' : '¿No tienes cuenta? Crear cuenta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
