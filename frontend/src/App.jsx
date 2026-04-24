import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API_BASE = import.meta.env.VITE_API_BASE ? '' : '/api'; // backend reverso ou variável

export default function App() {
  const [series, setSeries] = useState([]);
  const [municipios, setMunicipios] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const liveRef = useRef(null);

  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    if (resultado && liveRef.current) {
      liveRef.current.textContent = `Consulta concluída. Total: ${resultado.somaConsolidada}`;
    }
  }, [resultado]);

  const toggleSerie = (s) => {
    setSeries(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const consultar = async () => {
    setLoading(true);
    setResultado(null);
    try {
      const qs = new URLSearchParams();
      if (municipios.trim()) qs.set('municipios', municipios);
      const res = await fetch(`${API_BASE}/relacionado/totais-por-uf?${qs.toString()}`);
      const data = await res.json();
      setResultado({
        series,
        somaConsolidada: data?.reduce ? data.reduce((acc, x) => acc + (x.total || 0), 0) : 0,
        detalhes: data
      });
    } catch (err) {
      setResultado({ erro: 'Falha ao consultar' });
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const baseStyle = {
    padding: 24,
    fontFamily: 'Arial, system-ui',
    lineHeight: 1.5,
    background: highContrast ? '#000' : '#fff',
    color: highContrast ? '#fff' : '#111'
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 dark:text-white h-screen">
      {/* <a
        href="#conteudo"
        className="skip-link"
        style={{ position: 'absolute', left: -9999, top: 'auto' }}
        onFocus={(e) => { e.target.style.left = '8px'; e.target.style.top = '8px' }}
      >
        Pular para o conteúdo
      </a> */}
      <header role="banner">
        <div className="container mx-auto px-4 flex justify-between">
          <h1 className='text-center text-2xl py-4'>Consolidador de Matrículas — Censo Escolar</h1>
          <div className='flex items-center'>
            <button
              onClick={toggleTheme}
              className="block px-3 py-1 rounded-full border border-gray-400 transition cursor-pointer"
            >
              {/* Tema claro / escuro */}
              {theme === "light" ? "☾" : "☀︎"}
            </button>
          </div>
        </div>
      </header>

      <main
        id="conteudo"
        role="main"
        className="p-6 font-sans leading-relaxed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-[calc(100vh-116px)] overflow-auto"
      >
        <div className="container mx-auto">
          <section aria-labelledby="selecao-series">
            <h2 id="selecao-series" className="text-xl font-semibold mb-2">
              Selecione as séries a consolidar
            </h2>

            <div
              role="group"
              aria-label="Séries do Ensino Fundamental e Médio"
              className="flex flex-wrap gap-3"
            >
              {[8, 9, 1, 2, 3].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={series.includes(s)}
                    onChange={() => toggleSerie(s)}
                    className="accent-blue-500 cursor-pointer"
                  />
                  {s === 8 || s === 9 ? `${s}º Fundamental` : `${s}º Médio`}
                </label>
              ))}
            </div>
          </section>

          <section
            className="mt-4"
            aria-labelledby="entrada-municipios"
          >
            <h2 id="entrada-municipios" className="text-xl font-semibold mb-2">
              Digite os municípios (separados por vírgula)
            </h2>

            <input
              aria-describedby="dica-municipios"
              aria-label="Campo para inserir nomes de municípios separados por vírgula"
              type="text"
              value={municipios}
              onChange={e => setMunicipios(e.target.value)}
              className="w-4/5 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />

            <div id="dica-municipios" className="text-sm text-gray-500 mt-1">
              Ex.: São Roque, Votorantim, Sorocaba
            </div>
          </section>

          <div className="mt-4">
            <button
              onClick={consultar}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Consultando...' : 'Consolidar'}
            </button>
          </div>

          <div
            aria-live="polite"
            aria-atomic="true"
            ref={liveRef}
            className="absolute -left-2499.75"
          />

          {resultado && !resultado.erro && (
            <section
              className="mt-6"
              aria-labelledby="resultado-titulo"
            >
              <h2 id="resultado-titulo" className="text-xl font-semibold mb-2">
                Resultado
              </h2>

              <p className="mb-4">
                Para os municípios informados, o valor consolidado de matrículas das séries{" "}
                <b>{resultado.series.join(', ') || 'não selecionadas'}</b> é de{" "}
                <b>{resultado.somaConsolidada}</b> matriculados.
              </p>

              {Array.isArray(resultado.detalhes) && (
                <table className="w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <caption className="text-left p-2 font-medium">
                    Totais por UF
                  </caption>

                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="p-2 text-left border-b border-gray-300 dark:border-gray-600">
                        UF
                      </th>
                      <th className="p-2 text-right border-b border-gray-300 dark:border-gray-600">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {resultado.detalhes.map((row, idx) => (
                      <tr key={idx} className="odd:bg-gray-50 dark:odd:bg-gray-900">
                        <td className="p-2 border-b border-gray-200 dark:border-gray-700">
                          {row.SG_UF}
                        </td>
                        <td className="p-2 text-right border-b border-gray-200 dark:border-gray-700">
                          {row.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {resultado?.erro && (
            <div role="alert" className="mt-6 text-red-500">
              Ocorreu um erro ao efetuar a consulta.
            </div>
          )}
        </div>
      </main>

      <footer>
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>Atende WCAG 2.2: foco visível, navegação por teclado e aria-live para resultados.</p>
        </div>
      </footer>
    </div>
  );
}
